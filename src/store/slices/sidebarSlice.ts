import { createSlice } from '@reduxjs/toolkit';

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState: {
    leftCollapsed: false,
    collapsedIconIndex: 3,
  },
  reducers: {
    toggleLeftSidebar: (state) => {
      state.leftCollapsed = !state.leftCollapsed;

      if (state.leftCollapsed) {
        state.collapsedIconIndex = Math.floor(Math.random() * (7 - 3 + 1)) + 3;
      }
    },
  },
});

export const { toggleLeftSidebar } = sidebarSlice.actions;
export default sidebarSlice.reducer;
