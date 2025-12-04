import { createSlice } from '@reduxjs/toolkit';
import { updateUser } from '../../../api/controllers/user.controller';

const initialState = {
    currentUser: null,
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        signInStart: (state) => {
            state.loading = true;
        },
        signInSuccess: (state, action) => {
            state.currentUser = action.payload;
            state.loading = false;
            state.error = null;
        },
        signInFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        updateUserStart: (state)=>{
            state.loading=true;

        },

        updateUserSuccess: (state,action)=>{
            state.currentUser=action.payload;
            state.loading=false;
            state.error=null;

        },
        updateUserFailure: (state,action)=>{
            state.error=action.payload;
            state.loading=false;

        },
        deleteUserStart: (state)=>{
            state.loading=true;
        },
        deleteUserSuccess: (state,action)=>{
            state.currentUser=null;
            state.loading=false;
            state.error=null;
        },
        deleteUserFailure: (state,action)=>{
            state.error=action.payload;
            state.loading=false;
        },
        signOutStart: (state)=>{
            state.loading=true;
        },
        signOutSuccess: (state,action)=>{
            state.currentUser=null;
            state.loading=false;
            state.error=null;
        },
        signOutFailure: (state,action)=>{
            state.error=action.payload;
            state.loading=false;
        },
    },
});

export const { signInStart, signInSuccess, signInFailure, updateUserFailure,updateUserSuccess,updateUserStart,deleteUserStart,deleteUserSuccess,deleteUserFailure,signOutStart,signOutSuccess,signOutFailure     } = userSlice.actions;

export default userSlice.reducer;