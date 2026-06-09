import React, { createContext, useContext, useState, useEffect } from 'react';
import { authClient } from '../lib/auth-clients';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // authClient.useSession hook handles loading and session state automatically
    const { data: session, isPending: loading, error } = authClient.useSession();
    const user = session?.user || null;

    const login = async (email, password) => {
        const { data, error } = await authClient.signIn.email({
            email,
            password
        });
        if (error) throw error;
        return data;
    };

    const register = async (email, password, name) => {
        const { data, error } = await authClient.signUp.email({
            email,
            password,
            name: name || email.split('@')[0], // Optional name
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        const { error } = await authClient.signOut();
        if (error) throw error;
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
