const {admin,db}=require('./admin')

module.exports = async (req,res,next) =>{
    let idToken
    console.log(req.headers.authorization)
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1]
    } else{
        console.error('No token found')
        return res.json({error:'Unauthorized'})
    }
    let decodedToken=await admin.auth().verifyIdToken(idToken).catch(e=>{return res.status(500).json({error:'there was error'})})
    req.user=decodedToken
    let data=await db.collection('users').where('userId','==',req.user.uid).limit(1).get().catch(e=>{return res.status(500).json({error:'there was error'})})
    req.user.handle =  data.docs[0].data()
    req.user.imageUrl=  data.docs[0].data().imageUrl;
    console.log("this is fbauth")
    console.log(req.user.handle.handle)
    return next()
}