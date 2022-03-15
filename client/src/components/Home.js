import React, { useCallback, useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { Grid, CssBaseline, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { SidebarContainer } from '../components/Sidebar';
import { ActiveChat } from '../components/ActiveChat';
import { SocketContext } from '../context/socket';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100vh',
  },
}));

const Home = ({ user, logout }) => {
  const history = useHistory();

  const socket = useContext(SocketContext);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  const classes = useStyles();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const addSearchedUsers = (users) => {
    const currentUsers = {};

    // make table of current users so we can lookup faster
    conversations.forEach((convo) => {
      currentUsers[convo.otherUser.id] = true;
    });

    const newState = [...conversations];
    users.forEach((user) => {
      // only create a fake convo if we don't already have a convo with this user
      if (!currentUsers[user.id]) {
        let fakeConvo = {
          otherUser: { ...user, lastReadMessage: -1 },
          messages: [],
          unreadMessages: 0,
        };
        newState.push(fakeConvo);
      }
    });

    setConversations(newState);
  };

  const clearSearchedUsers = () => {
    setConversations((prev) => prev.filter((convo) => convo.id));
  };

  const saveMessage = async (body) => {
    const { data } = await axios.post('/api/messages', body);
    return data;
  };

  const sendMessage = (data, body) => {
    socket.emit('new-message', {
      message: data.message,
      recipientId: body.recipientId,
      sender: data.sender,
    });
  };

  const postMessage = async (body) => {
    try {
      const data = await saveMessage(body);

      if (!body.conversationId) {
        addNewConvo(body.recipientId, data.message);
      } else {
        addMessageToConversation(data);
      }

      sendMessage(data, body);
    } catch (error) {
      console.error(error);
    }
  };

  const addNewConvo = useCallback(
    (recipientId, message) => {
      setConversations((prev) => {
        const convo = prev.find((convo) => convo.otherUser.id === recipientId);
        const newConvos = prev.filter(
          (convo) => convo.otherUser.id !== recipientId
        );

        const convoCopy = {
          ...convo,
          id: message.conversationId,
          messages: [...convo.messages, message],
          latestMessageText: message.text,
          unreadMessages: 0,
        };

        return [convoCopy, ...newConvos];
      });
    },
    [setConversations]
  );

  const addMessageToConversation = useCallback(
    (data) => {
      // if sender isn't null, that means the message needs to be put in a brand new convo
      const { message, sender = null } = data;
      if (sender !== null) {
        const newConvo = {
          id: message.conversationId,
          otherUser: sender,
          messages: [message],
          latestMessageText: message.text,
          unreadMessages: 0,
        };

        if (newConvo.otherUser.username !== activeConversation)
          newConvo.unreadMessages += 1;

        setConversations((prev) => [newConvo, ...prev]);
        return;
      }

      // update the conversation that the message is for
      setConversations((prev) => {
        const convo = prev.find((convo) => convo.id === message.conversationId);
        const newConvos = prev.filter(
          (convo) => convo.id !== message.conversationId
        );

        const convoCopy = {
          ...convo,
          messages: [...convo.messages, message],
          latestMessageText: message.text,
        };

        if (convoCopy.otherUser.username !== activeConversation)
          convoCopy.unreadMessages += 1;
        else
          socket.emit('read-conversation', {
            conversationId: message.conversationId,
            sender: user,
            latestMessageId: message.id,
          });

        return [convoCopy, ...newConvos];
      });
    },
    [setConversations, activeConversation, socket, user]
  );

  const setActiveChat = useCallback(
    (username) => {
      setActiveConversation(username);

      const convoIndex = conversations.findIndex(
        (convo) => convo.otherUser.username === username
      );

      // exit early to not send socket event if conversation is fake
      if (!conversations[convoIndex].id) return;

      const convoCopy = {
        ...conversations[convoIndex],
        unreadMessages: 0,
      };
      conversations[convoIndex] = convoCopy;
      setConversations([...conversations]);

      // only send an event if there is a higher message id
      const last = conversations[convoIndex].messages.length - 1;
      if (last < 0) return;

      const userLastReadMessage =
        convoCopy.user1 === null
          ? convoCopy.user1ReadMessage
          : convoCopy.user2ReadMessage;
      const latestMessageId = conversations[convoIndex].messages[last].id;

      if (userLastReadMessage < latestMessageId)
        socket.emit('read-conversation', {
          conversationId: convoCopy.id,
          sender: user,
          latestMessageId: latestMessageId,
        });
    },
    [setActiveConversation, setConversations, conversations, socket, user]
  );

  const updateReadConversation = useCallback(
    (data) => {
      setConversations((prev) => {
        const convoIndex = prev.findIndex(
          (convo) => convo.id === data.conversationId
        );
        if (convoIndex === -1) return prev;

        // set the read status of the other user on the last read message
        const convoCopy = { ...prev[convoIndex] }

        const otherUserReadMessage = data.latestMessageId;
        const messages = convoCopy.messages;

        let previous = -1,
          current = 0;
        const otherUser = data.sender;

        while (
          current < messages.length &&
          otherUserReadMessage >= messages[current].id
        ) {
          if (messages[current].userLastRead)
            messages[current] = {
              ...messages[current],
              userLastRead: null,
            };
          if (messages[current].senderId === user.id) previous = current;
          current++;
        }
        if (previous >= 0)
          messages[previous] = {
            ...messages[previous],
            userLastRead: otherUser,
          };

        convoCopy.messages = [...messages];
        prev[convoIndex] = convoCopy;

        return [...prev];
      });
    },
    [setConversations, user]
  );

  const addOnlineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: true };
          return convoCopy;
        } else {
          return convo;
        }
      })
    );
  }, []);

  const removeOfflineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: false };
          return convoCopy;
        } else {
          return convo;
        }
      })
    );
  }, []);

  // Lifecycle

  useEffect(() => {
    // Socket init
    socket.on('add-online-user', addOnlineUser);
    socket.on('remove-offline-user', removeOfflineUser);
    socket.on('new-message', addMessageToConversation);
    socket.on('read-conversation', updateReadConversation);

    return () => {
      // before the component is destroyed
      // unbind all event handlers used in this component
      socket.off('add-online-user', addOnlineUser);
      socket.off('remove-offline-user', removeOfflineUser);
      socket.off('new-message', addMessageToConversation);
      socket.off('read-conversation', updateReadConversation);
    };
  }, [
    addMessageToConversation,
    addOnlineUser,
    removeOfflineUser,
    updateReadConversation,
    socket,
  ]);

  useEffect(() => {
    // when fetching, prevent redirect
    if (user?.isFetching) return;

    if (user && user.id) {
      setIsLoggedIn(true);
    } else {
      // If we were previously logged in, redirect to login instead of register
      if (isLoggedIn) history.push('/login');
      else history.push('/register');
    }
  }, [user, history, isLoggedIn]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await axios.get('/api/conversations');
        setConversations(data);
      } catch (error) {
        console.error(error);
      }
    };
    if (!user.isFetching) {
      fetchConversations();
    }
  }, [user]);

  const handleLogout = async () => {
    if (user && user.id) {
      await logout(user.id);
    }
  };

  return (
    <>
      <Button onClick={handleLogout}>Logout</Button>
      <Grid container component="main" className={classes.root}>
        <CssBaseline />
        <SidebarContainer
          conversations={conversations}
          user={user}
          clearSearchedUsers={clearSearchedUsers}
          addSearchedUsers={addSearchedUsers}
          setActiveChat={setActiveChat}
        />
        <ActiveChat
          activeConversation={activeConversation}
          conversations={conversations}
          user={user}
          postMessage={postMessage}
        />
      </Grid>
    </>
  );
};

export default Home;
