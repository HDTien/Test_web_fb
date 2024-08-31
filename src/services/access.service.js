'use strict';

const shopModel = require("../models/shop.model");
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const KeyTokenService = require("../services/keyToken.service")
const {createTokenPair} = require('../auth/authUtils')
const RoleShop ={
    SHOP:'SHOP',
    WRITER:'WRITER',
    EDITOR:'EDITOR',
    ADMIN:'ADMIN'
}

class AccessService { 
    static signUp = async ({name , email, password}) => { 
        try { 
            //step 1 check gamil
            const holedShop = await shopModel.findOne({ email }).lean()

            if (holedShop) { 
                return {
                    code: 'xxx',
                    message: 'Shop already registered!',
                    status: 'error'
                };
            }
            console.log('newshop:', { name, email, password, roles:[RoleShop.SHOP]});

            const passwordHash = await bcrypt.hash(password, 10)
            

            const  newShop = await shopModel.create({

                name, email, password: passwordHash, roles:[RoleShop.SHOP]
            })

            if(newShop) {
                //create privateKey, publicKey
                    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa',
                    {
                       
                        modulusLength: 4096,  
                        publicKeyEncoding:  {
                            type :'pkcs1',  
                            format :'pem'
                        },
                        privateKeyEncoding: {
                            type :'pkcs1', 
                            format :'pem'
                        }
                        // publicKeyEncoding: {
                        //     type: 'pkcs1',
                        //     format: 'pem'
                        // },
                        // privateKeyEncoding: {
                        //     type: 'pkcs1',
                        //     format: 'pem'
                        // }
                    })
                    console.log({ privateKey, publicKey })  

                    const   publicKeyString = await  KeyTokenService.createKeyToken({ 
                        userId: newShop._id, 
                        publicKey 
                    })
                        if(!publicKeyString) {
                            return  {
                                code: 'xxx',
                                message: 'publicKeyString error!',
                                status: 'error'
                        }
                    }
               
                           
                    const publicKeyObject = crypto.createPublicKey(publicKeyString)

                    // console.log('publicObject:', publicKeyObject);
                    


                     const tokens = await createTokenPair({ userId: newShop._id, email },  publicKeyObject, privateKey)
                     console.log(`Created Token Success::`, tokens)
                     return{
                        code :200,
                        metadata :{
                            shop :newShop,
                            tokens
                        }
                     }
                    
            }
            return {
                code :200,
                metadata :null
             }
        } catch (error) { 
            return {
                code: 'xxx',
                message : error.message,
                status: 'error'
            };  
        }
    }
}
module.exports= AccessService