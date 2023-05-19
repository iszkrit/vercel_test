import React, { useState } from 'react';
import axios from 'axios';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Settings from '@mui/icons-material/Settings';
import Divider from '@mui/material/Divider';


type User = {
  name:    string
  id:      string 
  color:   string
}

type Props = {
  user:                   User
  setUser:                React.Dispatch<React.SetStateAction<User>>
  accountMenuClose: () => void
}


const AccountSettingDialog = (props: Props) => {
   const [nameEdited, setNameEdited] = useState(props.user.name)
   const [open, setOpen] = useState(false);

   const handleClickOpen = () => {
      setOpen(true);
   };

   const handleClose = () => {
      setOpen(false);
   };

   const renameHandle = (e :React.FormEvent<HTMLFormElement>) => {
      if (nameEdited !== "") {
         const data = {
            name:   nameEdited,
            id:     props.user.id,
          };
          axios.put('http://localhost:8080/account', data)
          .then(response => {
            console.log('response body:', response.data);
          });
          props.setUser({name: nameEdited, id: props.user.id, color: props.user.color})
          handleClose()
          props.accountMenuClose()
          e.preventDefault()                
      } else {

         e.preventDefault()  
      }
    };

    const deleteHandle = () => {
      const deleteId = {
        id: props.user.id  
      };
      axios.delete('http://localhost:8080/account', {data: deleteId})
      .then(response => {
        console.log('response body:', response.data);
        props.setUser({name: "", id: "", color: ""})
      })
    };

   return (
      <div>
         <MenuItem onClick={()=>{handleClickOpen()}}>
            <ListItemIcon>
               <Settings fontSize="small" />
            </ListItemIcon>
            Setting
         </MenuItem>
         <Dialog open={open}>
            <DialogTitle>ユーザー設定</DialogTitle>
            <form onSubmit={renameHandle}>
               <DialogContent>
                  <DialogContentText>
                     ユーザー名の変更　
                  </DialogContentText>
                  <TextField
                     autoFocus
                     margin="dense"
                     value={nameEdited}
                     label={`変更後の名前は"${nameEdited}"`}
                     fullWidth
                     variant="standard"
                     onChange={(event)=>{setNameEdited(event.target.value)}}
                  />
               </DialogContent>
               <DialogActions>
                  <Button onClick={handleClose}>キャンセル</Button>
                  {nameEdited !== "" ? <Button type="submit">変更</Button> : <Button disabled>変更</Button>} 
               </DialogActions>
            </form>
            <Divider variant="middle" sx={{mt: 4, mb: 2}} />
            <DialogContentText sx={{mr: 10, ml: 10}}>
               ユーザーを削除したい場合、下のボタンを押してください
            </DialogContentText>
            <DialogActions>
               <Button sx={{mr: 30}} variant='outlined' color='error' onClick={deleteHandle}>削除</Button>
            </DialogActions>
         </Dialog>
      </div>
   );
};

export default AccountSettingDialog;