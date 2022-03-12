import React from 'react';
import { Box, Badge } from '@material-ui/core';
import { BadgeAvatar, ChatContent } from '../Sidebar';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    boxShadow: '0 2px 10px 0 rgba(88,133,196,0.05)',
    marginBottom: 10,
    '&:hover': {
      cursor: 'grab',
    },
  },
  badgeRoot: {
    display: 'flex',
    alignItems: 'center',
    position: 'static',
    borderRadius: 8,
    height: 80,
  },
  bubble: {...theme.chat.message.unread,
    padding: '4px 8px',
    marginRight: 20,
    position: 'static',
    transform: 'unset',
    transformOrigin: 'unset',
  },
}));

const Chat = ({ conversation, setActiveChat }) => {
  const classes = useStyles();
  const { otherUser } = conversation;
  const unreadMessages = conversation.messages.length;

  const handleClick = async (conversation) => {
    await setActiveChat(conversation.otherUser.username);
  };

  return (
    <Box onClick={() => handleClick(conversation)} className={classes.root}>
      <Badge badgeContent={unreadMessages}
        classes={{ root: classes.badgeRoot, badge: classes.bubble }}>
        <BadgeAvatar
          photoUrl={otherUser.photoUrl}
          username={otherUser.username}
          online={otherUser.online}
          sidebar={true}
        />
        <ChatContent conversation={conversation} />
      </Badge>
    </Box>
  );
};

export default Chat;
