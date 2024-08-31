'use strict';
const JWT = require('jsonwebtoken')   


const createTokenPair = async (payload, publicKey, privateKey) => {
 
    
    try{
        const  accessTocken = await JWT.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '2 days'
        })
        const refreshToken = await JWT.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '7 days'
        })  
        
        JWT.verify(accessTocken, publicKey, (err, decode) => {
            if (err) 
                console.log('err', err) 
            else
                console.log('decode', decode)
        })
      
        
        return { accessTocken, refreshToken }

    }catch (error) {
        console.log('auth_create token',error);
        

    }

}
module.exports = { 
    createTokenPair
}