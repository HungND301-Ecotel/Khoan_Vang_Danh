import { createTheme } from "@mui/material/styles";

// 1. Extend the palette types
declare module "@mui/material/styles" {
  interface Palette {
    table_name: Palette["primary"];
    table_add_button: Palette["primary"];
    table_delete_button: Palette["primary"];
    table_functional_button: Palette["primary"];
  }
  interface PaletteOptions {
    table_name?: PaletteOptions["primary"];
    table_add_button?: PaletteOptions["primary"];
    table_delete_button?: PaletteOptions["primary"];
    table_functional_button?: PaletteOptions["primary"];
  }
}

const custom_theme = createTheme({
  palette: {
    table_name: {
      main: '#2b4a82',   // your table name color
      light: '#4d6fae',  // optional lighter shade
      dark: '#1d325a',   // optional darker shade
      contrastText: '#fff'
    },
    table_add_button: {
      main: '#fba547',   // your add button color
      light: '#ffc67a',  // optional lighter shade
      dark: '#c6761a',   // optional darker shade
      contrastText: '#fff'
    },
    table_delete_button: {
      main: '#c82333',   // your delete button color
      light: '#ef5a65',  // optional lighter shade
      dark: '#931a25',   // optional darker shade
      contrastText: '#fff'
    },
    table_functional_button: {
      main: '#ffffff',   // your delete button color
      light: '#ffffff',  // optional lighter shade
      dark: '#f0f0f0',   // optional darker shade
      contrastText: '#fff'
    }
  },
});

export default custom_theme;