import React, { useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth';
import { auth } from '../../Firebase/Firebase.init';



const provider = new GoogleAuthProvider();

const AuthProvider = ({children}) => {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)


    const createUser = (email, password) =>{
        setLoading(true)
        return createUserWithEmailAndPassword(auth, email, password)
    }

    const signIn = (email, password)=>{
        setLoading(true)
        return signInWithEmailAndPassword(auth, email, password)
    }


    const signInWithGoogle = () =>{
        setLoading(true)
        return signInWithPopup(auth, provider)

    }

    const updateUserProfile = profileInfo =>{
        return updateProfile(auth.currentUser, profileInfo)

    }


    const logOut =() =>{
        setLoading(true)
        return signOut(auth)
    }

    const resetPassword = (email) =>{
        return sendPasswordResetEmail(auth, email)
    }




    // manage user on firebase
    useEffect(()=>{
        const unSubscribe = onAuthStateChanged((auth), currentUser=>{
            setUser(currentUser)
            console.log('user in the auth state Change', currentUser?.email);
            setLoading(false)
        })
        return unSubscribe;

    },[])

    const authInfo = {
        createUser,
        signIn, 
        signInWithGoogle,
        user,
        loading,
        logOut,
        updateUserProfile,
        resetPassword
        

    }



    return (
        <AuthContext value={authInfo}>
            {children}

        </AuthContext>
       
    );
};

export default AuthProvider;