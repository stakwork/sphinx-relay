import React, {useCallback, useEffect, useState} from 'react';
import * as api from '../../api'
import {useDropzone} from 'react-dropzone'
import File from './file.jsx'
import purchases from './fake'

export default function Media(props) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [description, setDescription] = useState('')
  const [myFiles, setMyFiles] = useState([])
  const [files, setFiles] = useState([])
  const [searchText, setSearchText] = useState('')
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [img, setImg] = useState(null)

  async function sign() {
    const ch = await api.media.GET('ask')
    const res = await api.relay.GET(`signer/${ch.challenge}`)
    const body = await api.media.POST('verify', {
      id: ch.id,
      sig: res.response.sig,
      pubkey: props.identity_pubkey
    })
    if(body && body.token) {
      console.log('success!')
      setLoggedIn(true)
    }
  }

  useEffect(() => {
    async function load(){
      const hasToken = localStorage.getItem(api.media.tokenName)
      await sign()
      setLoggedIn(true)
      const media = await api.media.GET('mymedia')
      console.log(media)
      setMyFiles(media)
    }
    load()
  }, []);

  const onDrop = useCallback(async files => {
    const ttl = 60*60*24*7 // one week
    const file = files[0] || {}
    var start = new Date();
    const r = await api.media.UPLOAD('public',file,{
      name: file.name||'filename',
      description: description||'description',
      ttl: ttl,
    })
    var end  = new Date();
    var time = end.getTime() - start.getTime();
    console.log('Upload Timer: finished in', time, 'ms');
    console.log(r)
    // await api.relay.POST('attachment', {
    //   muid: r.muid,
    //   file_name: r.filename,
    //   chat_id: 13,
    //   ttl: ttl,
    // })
  }, [description]) // subscribe to "description"

  async function search(){
    const medias = await api.media.GET(`search/${searchText}`)
    console.log(medias)
    setFiles(medias)
  }

  async function buy(){
    const {contacts, chats} = props
    console.log(contacts, chats)
    const contact = contacts && contacts.find(c=>!c.is_owner)
    const chat = chats.find(ch=> ch.contact_ids.includes(parseInt(contact.id)))
    if(!contact || !chat) return
    const p = await api.relay.POST('purchase',{
      chat_id: chat.id,
      contact_id: contact.id,
      amount: selectedMedia.price,
      muid: selectedMedia.muid
    })
    console.log(p)
  }

  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  if(!loggedIn){
    return <div>loading...</div>
  }
  return (<div>

    <input value={description} onChange={e=>setDescription(e.target.value)} 
      style={{width:'100%'}} placeholder="File Description"
    />
    {description && <div {...getRootProps()}>
      <input {...getInputProps()} />
      <div style={styles.dropperStyle(isDragActive)}>
        Drag and drop, or click to select
      </div>
    </div>}

    <div style={styles.row}>
      <h4>Your Files</h4>
      {myFiles && <div style={styles.files}>
        {myFiles.map(f=><File f={f} key={f.muid} />)}
      </div>}
    </div>

    <div style={styles.row}>
      <h4>The world's files</h4>
      
      {selectedMedia && <div style={styles.search}>
        <strong>{`Buy ${selectedMedia.name}?`}</strong>&nbsp;&nbsp;
        <button onClick={buy}>ok</button>&nbsp;
        <button onClick={()=>setSelectedMedia(null)}>cancel</button>
      </div>}

      {!selectedMedia && <div style={styles.search}>
        <input value={searchText} onChange={e=> setSearchText(e.target.value)}
          onKeyPress={e=>{
            if(e.key==='Enter') search()
          }} placeholder="Search" />
        <button disabled={!searchText} onClick={search}>ok</button>
      </div>}

      {files && <div style={styles.files}>
        {files.map(f=><File f={f} key={f.muid} 
          selected={f.muid===(selectedMedia&&selectedMedia.muid)}
          onClick={()=>setSelectedMedia(f)}
        />)}
      </div>}
    </div>

    <div style={styles.row}>
      <h4>Purchases</h4>
      {purchases && <div style={styles.files}>
        {purchases.map(f=><File key={f.id}
          f={{...f, name:'wolf', price:0}} 
          onClick={async()=>{
            console.log(f)
            const blob = await api.media.BLOB(`file/${f.id}_${f.exp}_${f.mypubkey}?receipt=${f.receipt}`)
            const reader = new FileReader()
            reader.onloadend = () => setImg(reader.result)
            reader.readAsDataURL(blob)
          }}
        />)}
      </div>}
    </div>
    
    {img && <img height="200" src={img} />}

  </div>)
}
const styles={
  row:{
    marginTop:15, 
    border:'1px solid #dadada',
    padding:10,
  },
  search:{
    width:300,height:22
  },
  files:{
    display:'flex',
  },
  dropperStyle: (active) => ({
    borderRadius: 5,
    background: 'white',
    height:50,
    width:'100%',
    cursor:'pointer',
    padding:'14px 18px',
    border: `2px dashed ${active?'#0087F7':'#a9a9a9'}`,
    color: `${active?'#0087F7':'rgba(0,0,0,.65)'}`
  })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}