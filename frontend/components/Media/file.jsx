import React, {useState} from 'react';
import * as api from '../../api'

export default function File({f,onClick,selected}) {
  const extraStyles = selected ? {background:'grey',color:'white'} : {}
  return (<div onClick={onClick}
    style={{...styles.file, ...extraStyles}}>
    <div style={styles.name}>{f.name}</div>
    <div style={styles.price}>
      {`${f.price} sats`}
    </div>
  </div>)
}

const styles={
  file:{
    height:100,width:89,margin:4,
    border:'1px solid grey',
    borderRadius:5,
    background:'whitesmoke',
    cursor:'pointer',
    display:'flex',
    flexDirection:'column',
    alignItems:'center',
    justifyContent:'space-around',
  },
  name:{
    fontSize:'14px',
    margin:10,
  },
  price:{
    fontWeight:'bold',
    fontSize:'11px',
    margin:12
  }
}