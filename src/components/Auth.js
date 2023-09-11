import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { setAccessToken } from '../authSlice';

function Auth() {

    const dispatch = useDispatch();
    const [dispatched, setDispatched] = useState(false);
    const access_token = useSelector((state) => state.auth.access_token);

    useEffect(() => {
        const handleCallback = () => {
        const hashParams = {};
        const regex = /([^&;=]+)=?([^&;]*)/g;
        let m;

        while ((m = regex.exec(window.location.hash.substring(1)))) {
            hashParams[m[1]] = decodeURIComponent(m[2]);
        }

        localStorage.setItem('access_token', hashParams.access_token);
        window.close()
        // if(dispatched===false){
        //     setDispatched(true);
        //     window.close();
        //     // window.dispatchEvent(new Event("storage"));
        //     dispatch(setAccessToken(hashParams.access_token));
        // }
        console.log('auth',access_token, hashParams.access_token)
        };

        handleCallback();
        
    }, []);



    return(
        <div>Logging in..</div>
    )
}

export default Auth;