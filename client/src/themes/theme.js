import { createMuiTheme } from "@material-ui/core";

export const theme = createMuiTheme({
  typography: {
    fontFamily: "Open Sans, sans-serif",
    fontSize: 14,
    button: {
      textTransform: "none",
      letterSpacing: 0,
      fontWeight: "bold"
    }
  },
  overrides: {
    MuiInput: {
      input: {
        fontWeight: "bold"
      }
    }
  },
  palette: {
    primary: { main: "#3A8DFF" },
    secondary: { main: "#B0B0B0" }
  },
  chat: {
    message: {
      unread: {
        backgroundColor: '#3F92FF',
        color: 'white',
        fontWeight: 'bold',
      },
      sender: {
        background: '#F4F6FA',
        borderRadius: '10px 10px 0 10px',
      },
      other: {
        backgroundImage: 'linear-gradient(225deg, #6CC1FF 0%, #3A8DFF 100%)',
        borderRadius: '0 10px 10px 10px',
      },
    },
  },
});
