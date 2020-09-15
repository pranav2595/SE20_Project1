const {db} = require("../util/admin")

exports.getAllScreams = (req,res)=>{
    db.collection('screams').orderBy('createdAt','desc').get()
    .then(data =>{
        let screams=[]
        data.forEach(doc=>{
            screams.push({
                screamId: doc.id,
                body:doc.data().body,
                userHandle:doc.data().userHandle,
                createdAt:doc.data().createdAt,
                commentCount:doc.data().commentCount,
                likeCount: doc.data().likeCount,
                userImage:doc.data().userImage
            })
        })
        return res.json(screams)
    })
    .catch(err => console.error(err)) 
}

exports.postOneScream= (req,res) => {
    if(req.body.body.trim()=='')return res.json({error:'Scream cannot be emppty'})
    
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle.handle,
        userImage:req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount:0,
        commentcount:0

    }
        db.collection('screams')
        .add(newScream)
        .then(doc => {
            const resScream=newScream
            resScream.screamId= doc.id;
            res.json(resScream)
        })
        .catch(err=>{
            res.status(500).json({error:'something went wrong'})
            console.err
        })
}

exports.getScream=async (req,res)=>{
    let screamData={};
    let doc = await db.doc(`/screams/${req.params.screamId}`).get().catch((e) => {
        return res.status(500).json({ error: e });
      });
    if(doc.exists){
        screamData=doc.data();
        screamData.screamId=doc.id;
        let comments=await db.collection('comments').orderBy('createdAt','desc').where('screamId','==',req.params.screamId).get().catch((e) => {
            return res.status(500).json({ error: e });
          });
        screamData.comments=[];
        comments.forEach((doc)=>{
            screamData.comments.push(doc.data());
        })
        return  res.json(screamData)
    } 
}

exports.commentOnScream = async (req,res)=>{
    if(req.body.body.trim()===''){
        return res.status(400).json({comment:'Must not be empty'})
    }
    const newComment={
        body:req.body.body,
        createdAt:new Date().toISOString(),
        screamId:req.params.screamId,
        userHandle:req.user.handle.handle,
        userImage:req.user.imageUrl
    }
    console.log(newComment);
    let doc=await db.doc(`/screams/${req.params.screamId}`).get()
    if(!doc.exists){
        return res.status(404).json({error:'scream not found'})
    }
    else{
        await doc.ref.update({commentCount: doc.data().commentCount+1}).catch((e) => {
            return res.status(500).json({ error: e });
          });
        await db.collection('comments').add(newComment).catch((e) => {
            return res.status(500).json({ error: e });
          });;
        res.json(newComment);
    }
}

exports.likeScream = async (req,res)=>{
    const likeDocument=await db.collection('likes').where('userHandle','==',req.user.handle.handle)
                                .where('screamId','==',req.params.screamId).limit(1);
    const screamDocument=db.doc(`/screams/${req.params.screamId}`);
    let screamData={};
    let doc=await screamDocument.get().catch((e) => {
        return res.status(500).json({ error: e });
      });
    if(doc.exists){
        screamData=doc.data();
        screamData.screamId=doc.id;
        let like=await likeDocument.get().catch((e) => {
            return res.status(500).json({ error: e });
          });
        if(like.empty){
            await db.collection('likes').add({
                screamId: req.params.screamId,
                userHandle: req.user.handle.handle
            }).catch((e) => {
                return res.status(500).json({ error: e });
              });
            screamData.likeCount++;
            await screamDocument.update({likecount:screamData.likeCount}).catch((e) => {
                return res.status(500).json({ error: e });
              });
            return res.json(screamData);
        }
        else {
            return res.status(400).json({error:"scream already liked"});
        }

    }
    else{
        return res.status(400).json({error:'scream does not exists'});
    }
}

exports.unlikeScream = async (req,res)=>{
    const likeDocument=await db.collection('likes').where('userHandle','==',req.user.handle.handle)
                                .where('screamId','==',req.params.screamId).limit(1);
    const screamDocument=db.doc(`/screams/${req.user.handle.handle}`);
    let screamData={};
    let doc=await screamDocument.get().catch((e) => {
        return res.status(500).json({ error: e });
      });
    if(doc.exists){
        screamData=doc.data();
        screamData.screamId=doc.id;
        let like=await likeDocument.get().catch((e) => {
            return res.status(500).json({ error: e });
          });
        if(like.empty){
            return res.status(400).json({error:"scream already liked"});
            
        }
        else {
            await db.doc(`/likes/${data.docs[0].id}`).delete();
            screamData.likeCount--;
            await screamDocument.update({likecount:screamData.likeCount}).catch((e) => {
                return res.status(500).json({ error: e });
              });
              return res.json(screamData);
        }

    }
    else{
        return res.status(400).json({error:'scream does not exists'});
    }
}

exports.deleteScream=async (req,res)=>{
        const document=await db.doc(`/screams/${req.params.screamId}`)
        let doc=await document.get().catch((e) => {
            return res.status(500).json({ error: e });
        });
        if(!doc.exists){
            return res.status(404).json({error:"Scream not found"});
        }
        if(doc.data().userHandle!==req.user.handle.handle){
          return res.status(400).json({error:"unAuthorized"});
        }
        else{
            await document.delete().catch((e) => {
                return res.status(500).json({ error: e });
              });
              return res.json({message:"scream deleted successfully"});
        }

}



