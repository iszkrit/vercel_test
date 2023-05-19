import React, { useState, useEffect, useCallback } from 'react';
import { AvatarIcon } from './index';
import niceStamp from "../assets/images/niceStamp.jpg";

import axios from 'axios';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import DoneIcon from '@mui/icons-material/Done';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';



type User = {
   name:    string
   id:      string 
   color:   string
};

type Message = {
   content:   string
   id:        string
   sender:    string
   channel:   string
   date:      string
   edited:    boolean
};

type Like = {
   likeId:    string
   messageId: string
   accountId: string
}

type Props = {
   user:         User
   nowChannel:   string
   isEditing:    boolean
};

const Thread = (props: Props) => {

   const [accounts, setAccounts] = useState<User[]>([]);
   const [messages, setMessages] = useState<Message[]>([]);
   const [likes, setLikes] = useState<Like[]>([]);
   const [text, setText] = useState("");
   const [keyword, setKeyword] = useState("");
   const [selectedMessageId, setSelectedMessageId] = useState("");
   let userLikes = likes?.filter((like: Like) => {return like.accountId === props.user.id}) ?? []

   function classifyByChannel() {
      axios.get('http://localhost:8080/message')
      .then(res => {
         setMessages(res.data?.filter((message :Message) => {
            return message.channel===props.nowChannel
         }))
      })
   };

   function classifyByBookmark() {
      axios.options('http://localhost:8080/message', {
         params: {
            accountId: props.user.id
         }
      })
      .then(res => {
         setMessages(res.data)
      })
   };

   function classifyBySearch() {
      axios.get('http://localhost:8080/message')
      .then(res => {
         setMessages(res.data?.filter((message :Message) => {
            return message.content.indexOf(keyword)>-1
         }))
      })
   };

   function messageRefresh() {
      switch (props.nowChannel) {
         case "bookmark":
            classifyByBookmark() 
            break;
         case "search":
            classifyBySearch()
            break;    
         default:
            classifyByChannel()
      } 
   };

   function accountRefresh() {
      axios.get('http://localhost:8080/account')
      .then(res => {
         setAccounts(res.data)
      })
   };

   function likeRefresh() {
      axios.get('http://localhost:8080/like')
      .then(res => {
         setLikes(res.data)
      })
   };

   useEffect(() => {
      if (props.nowChannel==="search") {
         classifyBySearch() 
      }
   }, [keyword]);

   useEffect(() => {
      messageRefresh()
      setText("")
   }, [props.nowChannel]);

   useEffect(() => {
      accountRefresh()
   }, [accounts]);

   useEffect(() => {
      accountRefresh()
      likeRefresh()
   }, []);

   // --------------------------------------------メッセージ送信系--------------------------------------------
   function sendHandle(e: React.FormEvent<HTMLFormElement>) {
      if (text !== "") {
         const data = {
            content:  text,
            sender:   props.user.id,
            channel:  props.nowChannel
         };
         axios.post('http://localhost:8080/message', data)
         .then(response => {
            console.log('response body:', response.data);
            messageRefresh()
         });
         setText("")
         scrollToBottomOfList()
         e.preventDefault()       
      } else {
         e.preventDefault()
      };
   };

   const sendMessageBar = () => {
      return (
         <div className="submit">   
            <Box sx={{display: 'flex'}}>
               <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 80, textAlign: 'center'}} elevation={15}>
                  <form onSubmit={sendHandle}>
                     <TextField sx={{ mt:1.6, width:650 }} label="メッセージを入力" value={text} onChange={(event)=>{setText(event.target.value)}} />
                     <Button sx={{mt:-3, ml:1.5}} type="submit" variant="contained" endIcon={<SendIcon />}>
                        送信
                     </Button>
                     <img src={niceStamp} className="niceButton" onClick={sendNiceStamp}/>
                  </form>
               </Paper>
            </Box>
         </div>
      );
   };



  // --------------------------------------------メッセージ編集系--------------------------------------------
   function editHandle(message: string, messageId: string) {
      setText(message)
      setSelectedMessageId(messageId)
   };

   const editMessageBar = () => {
      
      function changeHandle(e :React.FormEvent<HTMLFormElement>) {
         const data = {
            content:   text,
            id:        selectedMessageId,
         };
         axios.put('http://localhost:8080/message', data)
         .then(response => {
            console.log('response body:', response.data);
            setText("")
            setSelectedMessageId("")
            messageRefresh() 
         });
         e.preventDefault()
      };

      return (
         <div className="submit">   
            <Box sx={{display: 'flex'}}>
               <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 80, textAlign: 'center'}} elevation={10}>           
                     {(selectedMessageId === "") ?
                        <></>
                     :
                     (
                        <form onSubmit={changeHandle}>
                           <TextField sx={{ mt:1.6, width:650 }} label="メッセージを編集" value={text} onChange={(event)=>{setText(event.target.value)}} />
                           <Button sx={{mt:2.6, ml:1}} type="submit" variant="contained" endIcon={<SendIcon />}>修正 </Button> 
                        </form>
                     )}
               </Paper>
            </Box>
         </div>
      );
   };

   const editMenu = (message: Message) => {
      return (
         <div className="messageMenu">
            <Stack direction="row" spacing={1}>
               <Chip
                  label="編集"
                  onClick={()=>editHandle(message.content, message.id)}
                  onDelete={()=>editHandle(message.content, message.id)}
                  deleteIcon={<DoneIcon />}
                  size="small"
               />
               <Chip
                  label="削除"
                  onClick={()=>deleteHandle(message.id)}
                  onDelete={()=>deleteHandle(message.id)}
                  deleteIcon={<DeleteIcon />}
                  size="small"
               />
            </Stack>
         </div>
      );
   };

   const deleteHandle = (messageId: string) => {
      const deleteId = {
         id: messageId   
      };
      axios.delete('http://localhost:8080/message', {data: deleteId})
      .then(response => {
         console.log('response body:', response.data);
         messageRefresh();
      });
   };

   // --------------------------------------------スレッドで扱うメソッド--------------------------------------------
   type SenderInfo = {
      senderName:    string
      senderColor:   string
   };

   function returnSenderInfo(senderId: string) :SenderInfo {
      const senderInfo = accounts.find(function(account) {return account.id === senderId});
      return senderInfo ? {senderName: senderInfo.name, senderColor: senderInfo.color} : {senderName: "unknown", senderColor : ""};
   };

   function returnLikeId (messageId: string) :string {
      return userLikes?.find((like) => like.messageId === messageId)?.likeId ?? "";
   };

   const likeButton = (accountId: string, messageId: string, likeId: string) => { 

      function pushLike(accountId: string, messageId: string) {
         const data = {
            messageId: messageId,
            accountId: accountId   
         };
         axios.post('http://localhost:8080/like', data)
         .then(response => {
            likeRefresh()
         });
      };

      function undoLike(likeId: string) {
         const data = {
            id: likeId
         };
         axios.delete('http://localhost:8080/like', {data: data})
         .then(response => {
            likeRefresh()
         });
      };

      return likeId !== "" ? <a onClick={()=>{undoLike(likeId)}}><ThumbUpAltIcon sx={{mt:1.2, ml:0.7}}/>{returnLikeAmount(messageId)}</a> : <a onClick={()=>{pushLike(accountId, messageId)}}><ThumbUpOffAltIcon sx={{mt:1.2, ml:0.7}}/>{returnLikeAmount(messageId)}</a>
   };

   function returnLikeAmount(messageId: string) :number|string {
      const likeAmount = likes?.filter((like: Like) => {return messageId===like.messageId}).length ?? "0"
      if (likeAmount > 0) {
         return likeAmount
      } else {
         return ""
      }
   };

   const ref = React.createRef<HTMLDivElement>()
   const scrollToBottomOfList = useCallback(() => {
      ref!.current!.scrollIntoView({
         behavior: 'smooth',
         block: 'end',
      })
   }, [ ref ]);

   const messageOrStamp =(content: string) => {
      return content === "niceStamp" ? <img src={niceStamp} width="100" height="100"/> : <a>{content}</a> 
   };

   function sendNiceStamp() {
      const data = {
         content:  "niceStamp",
         sender:   props.user.id,
         channel:  props.nowChannel
      };
      axios.post('http://localhost:8080/message', data)
      .then(response => {
         console.log('response body:', response.data);
         messageRefresh()
      });
      setText("")
      scrollToBottomOfList()
   };
    
   function displayTextform() {
      switch (props.nowChannel) {
         case "bookmark":
            return 
         case "search":
            return searchBar()
         default:
            return props.isEditing ? editMessageBar() : sendMessageBar()
      }
   };

   const searchBar = () => {
      return (
         <div className="submit">   
            <Box sx={{display: 'flex'}}>
               <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 80, textAlign: 'center'}} elevation={15}>
                  <form>
                     <TextField sx={{ mt:1.6, width:650 }} label="ワードが含まれるメッセージを検索(メッセージ一覧表示中)" value={keyword} onChange={(event)=>{setKeyword(event.target.value)}} />
                  </form>
               </Paper>
            </Box>
         </div>
      );
   };



  // --------------------------------------------スレッド本体-------------------------------------------- 
   return(
      <div>
         <h2 className="channel">スレッド一覧</h2>
         <Button onClick={scrollToBottomOfList}>最新のメッセージへ</Button>
         <div className="thread">
            {messages?.map((message: Message, index: number) => (
               <li key={index}>
                  <div>
                     <div className="messageInfo">
                        <AvatarIcon accountName={returnSenderInfo(message.sender).senderName} accountColor={returnSenderInfo(message.sender).senderColor}/>
                        <a className="senderName">{returnSenderInfo(message.sender).senderName}</a>
                        <a className="sendDate">{message.date}</a>
                        {message.edited ? <a className="alreadyEdited">(編集済み)</a> : null}
                        {likeButton(props.user.id, message.id, returnLikeId(message.id))}
                        {(props.isEditing && props.user.id === message.sender) ? editMenu(message) : null}
                     </div>
                     <div className="messageContents">
                        {messageOrStamp(message.content)}
                     </div>
                  </div>
               </li>
             ))}
             <br />
         </div>
         <div ref={ref}>
            {displayTextform()}
         </div>
      </div>
   );
};
  
export default Thread;