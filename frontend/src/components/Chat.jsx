import { useEffect, useState, useRef, useContext, useMemo, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { FiLogOut, FiUsers, FiSend, FiSmile, FiPaperclip, FiEdit, FiFile, FiX, FiDownload } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import { Base_Url } from '../../API';
import { AuthContext } from '../context/AuthContext';

let socketInstance = null;

function Chat() {
  const { currentUser, setCurrentUser, logout } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [profile, setProfile] = useState({ username: '', email: '', bio: '', profilePicture: '' });
  const [profileForm, setProfileForm] = useState({ username: '', email: '', bio: '', password: '' });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [groupPictureFile, setGroupPictureFile] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [viewingUserProfile, setViewingUserProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [tempMessageIds, setTempMessageIds] = useState({});
  const [isStartingChat, setIsStartingChat] = useState(false);

  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const defaultProfilePicture = 'https://i.pinimg.com/736x/cc/84/49/cc8449c90a4b19a0d856eb0f205a0da5.jpg';
  const getMessageSignature = (message) => {
    return `${message.sender._id}-${message.timestamp}-${message.fileName || message.content}`;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(Base_Url, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        withCredentials: true,
      });
    }

    const handleConnect = () => {
      if (currentUser?.userId) {
        socketInstance.emit('userConnected', currentUser.userId);
      }
    };

    const handleConnectError = (err) => {
      console.error('Socket.IO connect error:', err.message);
      toast.error('Failed to connect to chat server');
    };

    const handleReceiveMessage = (message) => {
      if (!currentUser?.userId) return;

      const chatId = message.chatId;
      const sender = users.find((u) => u._id === message.sender._id) || { username: 'Unknown' };
      const messageSignature = getMessageSignature(message);

      const isDuplicate = messages.some(
        (m) => m._id === message._id || getMessageSignature(m) === messageSignature
      );

      if (isDuplicate) {
        return;
      }

      const tempId = Object.keys(tempMessageIds).find((tid) => tempMessageIds[tid] === message._id);
      if (tempId) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempId
              ? {
                  ...message,
                  fileUrl: message.fileUrl,
                  fileType: message.fileType,
                  fileName: message.fileName,
                }
              : m
          )
        );
        setTempMessageIds((prev) => {
          const newTempIds = { ...prev };
          delete newTempIds[tempId];
          return newTempIds;
        });
      } else if (selectedUser && chatId === [currentUser.userId, selectedUser._id].sort().join('-')) {
        setMessages((prev) => [
          ...prev,
          {
            ...message,
            fileUrl: message.fileUrl,
            fileType: message.fileType,
            fileName: message.fileName,
          },
        ]);
      }

      if (message.sender._id !== currentUser.userId) {
        if (!selectedUser || chatId !== [currentUser.userId, selectedUser._id].sort().join('-')) {
          toast.info(`New message from ${sender.username}${message.fileUrl ? ' (File)' : ''}`, {
            toastId: `msg-${message._id}`,
            autoClose: 5000,
            onClick: () => {
              const user = users.find((u) => u._id === message.sender._id);
              if (user) {
                setSelectedUser(user);
                setSelectedGroup(null);
                setShowProfile(false);
                setViewingUserProfile(null);
                setSidebarOpen(false);
                setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }));
              }
            },
          });
          setUnreadCounts((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || 0) + 1,
          }));
        }
      }
    };

    const handleReceiveGroupMessage = (message) => {
      if (!currentUser?.userId) return;

      const groupId = message.group.toString();
      const group = groups.find((g) => g._id === groupId) || { name: 'Unknown' };
      const sender = users.find((u) => u._id === message.sender._id) || { username: 'Unknown' };
      const messageSignature = getMessageSignature(message);

      const isDuplicate = messages.some(
        (m) => m._id === message._id || getMessageSignature(m) === messageSignature
      );

      if (isDuplicate) {
        return;
      }

      const tempId = Object.keys(tempMessageIds).find((tid) => tempMessageIds[tid] === message._id);
      if (tempId) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempId
              ? {
                  ...message,
                  fileUrl: message.fileUrl,
                  fileType: message.fileType,
                  fileName: message.fileName,
                }
              : m
          )
        );
        setTempMessageIds((prev) => {
          const newTempIds = { ...prev };
          delete newTempIds[tempId];
          return newTempIds;
        });
      } else if (selectedGroup && groupId === selectedGroup._id) {
        setMessages((prev) => [
          ...prev,
          {
            ...message,
            fileUrl: message.fileUrl,
            fileType: message.fileType,
            fileName: message.fileName,
          },
        ]);
      }

      if (message.sender._id !== currentUser.userId) {
        if (!selectedGroup || groupId !== selectedGroup._id) {
          toast.info(`New message from ${sender.username} in ${group.name}${message.fileUrl ? ' (File)' : ''}`, {
            toastId: `msg-${message._id}`,
            autoClose: 5000,
            onClick: () => {
              const group = groups.find((g) => g._id === groupId);
              if (group) {
                setSelectedGroup(group);
                setSelectedUser(null);
                setShowProfile(false);
                setViewingUserProfile(null);
                setSidebarOpen(false);
                setShowGroupMembers(false);
                setUnreadCounts((prev) => ({ ...prev, [groupId]: 0 }));
              }
            },
          });
          setUnreadCounts((prev) => ({
            ...prev,
            [groupId]: (prev[groupId] || 0) + 1,
          }));
        }
      }
    };

    const handleMessageRead = (message) => {
      setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
      if (message.chatId && selectedUser && message.chatId === [currentUser.userId, selectedUser._id].sort().join('-')) {
        setUnreadCounts((prev) => ({ ...prev, [message.chatId]: 0 }));
      } else if (message.group && selectedGroup && message.group.toString() === selectedGroup._id) {
        setUnreadCounts((prev) => ({ ...prev, [message.group.toString()]: 0 }));
      }
    };

    const handleOnlineUsers = (onlineUserIds) => {
      setUsers((prev) =>
        prev.map((user) => ({
          ...user,
          online: onlineUserIds.includes(user._id),
        }))
      );
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('connect_error', handleConnectError);
    socketInstance.on('receiveMessage', handleReceiveMessage);
    socketInstance.on('receiveGroupMessage', handleReceiveGroupMessage);
    socketInstance.on('messageRead', handleMessageRead);
    socketInstance.on('onlineUsers', handleOnlineUsers);

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('connect_error', handleConnectError);
      socketInstance.off('receiveMessage', handleReceiveMessage);
      socketInstance.off('receiveGroupMessage', handleReceiveGroupMessage);
      socketInstance.off('messageRead', handleMessageRead);
      socketInstance.off('onlineUsers', handleOnlineUsers);
    };
  }, [currentUser, selectedUser, selectedGroup, users, groups, messages, tempMessageIds]);

  useEffect(() => {
    if (currentUser?.userId && socketInstance) {
      socketInstance.emit('userConnected', currentUser.userId);
    }
  }, [currentUser]);

  const chatId = useMemo(() => {
    if (currentUser?.userId && selectedUser) {
      return [currentUser.userId, selectedUser._id].sort().join('-');
    }
    return null;
  }, [currentUser, selectedUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        const res = await axios.get(`${Base_Url}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.map((user) => ({ ...user, online: false })));
      } catch (err) {
        console.error('Fetch users error:', err);
        toast.error(err.response?.status === 401 ? 'Unauthorized: Please log in again' : 'Failed to fetch users');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setCurrentUser(null);
          navigate('/login');
        }
      }
    };
    fetchUsers();
  }, [setCurrentUser, navigate]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        const res = await axios.get(`${Base_Url}/groups`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroups(res.data);
      } catch (err) {
        console.error('Fetch groups error:', err);
        toast.error(err.response?.status === 401 ? 'Unauthorized: Please log in again' : 'Failed to fetch groups');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setCurrentUser(null);
          navigate('/login');
        }
      }
    };
    fetchGroups();
  }, [setCurrentUser, navigate]);

  useEffect(() => {
    const fetchAllGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        const res = await axios.get(`${Base_Url}/groups/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllGroups(res.data);
      } catch (err) {
        console.error('Fetch all groups error:', err);
        toast.error(err.response?.status === 401 ? 'Unauthorized: Please log in again' : 'Failed to fetch all groups');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setCurrentUser(null);
          navigate('/login');
        }
      }
    };
    fetchAllGroups();
  }, [setCurrentUser, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        const res = await axios.get(`${Base_Url}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
        setProfileForm({
          username: res.data.username,
          email: res.data.email,
          bio: res.data.bio || '',
          password: '',
        });
      } catch (err) {
        console.error('Fetch profile error:', err);
        toast.error(err.response?.status === 401 ? 'Unauthorized: Please log in again' : 'Failed to fetch profile');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setCurrentUser(null);
          navigate('/login');
        }
      }
    };
    fetchProfile();
  }, [setCurrentUser, navigate]);

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !currentUser?.userId) return;
        const newUnreadCounts = {};
        // Fetch unread counts for private chats
        for (const user of users) {
          const chatId = [currentUser.userId, user._id].sort().join('-');
          const res = await axios.get(`${Base_Url}/messages/${chatId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          newUnreadCounts[chatId] = res.data.unreadCount || 0;
        }
        // Fetch unread counts for groups
        for (const group of groups) {
          const res = await axios.get(`${Base_Url}/groups/${group._id}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          newUnreadCounts[group._id] = res.data.unreadCount || 0;
        }
        setUnreadCounts(newUnreadCounts);
      } catch (err) {
        console.error('Fetch unread counts error:', err);
      }
    };
    if (users.length > 0 && groups.length > 0) {
      fetchUnreadCounts();
    }
  }, [users, groups, currentUser]);

  const fetchMessages = useCallback(async () => {
    if (!currentUser?.userId || (!selectedUser && !selectedGroup)) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      if (selectedUser && chatId) {
        socketInstance?.emit('joinChat', chatId);
        const res = await axios.get(`${Base_Url}/messages/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data.messages);
        setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }));

        for (const msg of res.data.messages) {
          if (!msg.readBy.some((user) => user._id === currentUser.userId) && msg.sender._id !== currentUser.userId) {
            await axios.put(
              `${Base_Url}/messages/${msg._id}/read`,
              {},
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            socketInstance?.emit('markMessageRead', {
              messageId: msg._id,
              userId: currentUser.userId,
              chatId,
            });
          }
        }
      } else if (selectedGroup) {
        socketInstance?.emit('joinGroup', selectedGroup._id);
        const res = await axios.get(`${Base_Url}/groups/${selectedGroup._id}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data.messages);
        setUnreadCounts((prev) => ({ ...prev, [selectedGroup._id]: 0 }));

        for (const msg of res.data.messages) {
          if (!msg.readBy.some((user) => user._id === currentUser.userId) && msg.sender._id !== currentUser.userId) {
            await axios.put(
              `${Base_Url}/messages/${msg._id}/read`,
              {},
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            socketInstance?.emit('markMessageRead', {
              messageId: msg._id,
              userId: currentUser.userId,
              groupId: selectedGroup._id,
            });
          }
        }
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
      toast.error(err.response?.status === 401 ? 'Unauthorized: Please log in again' : 'Failed to fetch messages');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setCurrentUser(null);
        navigate('/login');
      }
    }
  }, [currentUser, selectedUser, selectedGroup, chatId, navigate, setCurrentUser]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const checkExistingChat = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const chatId = [currentUser.userId, userId].sort().join('-');
      const res = await axios.get(`${Base_Url}/messages/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.messages.length > 0 ? chatId : null;
    } catch (err) {
      console.error('Check existing chat error:', err);
      return null;
    }
  };

  const viewUserProfile = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.get(`${Base_Url}/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViewingUserProfile({ ...res.data, userId });
      setShowProfile(false);
      setSidebarOpen(false);
      setShowGroupMembers(false);
    } catch (err) {
      console.error('View user profile error:', err);
      toast.error(err.response?.status === 401 ? 'Unauthorized: Please log in again' : 'Failed to fetch user profile');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setCurrentUser(null);
        navigate('/login');
      }
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.get(`${Base_Url}/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return {
        _id: userId,
        username: res.data.username,
        profilePicture: res.data.profilePicture,
        online: false,
      };
    } catch (err) {
      console.error('Fetch user details error:', err);
      throw new Error('Failed to fetch user details');
    }
  };

  const startChatWithUser = async () => {
    if (!viewingUserProfile || !viewingUserProfile.userId) {
      toast.error('User profile not loaded correctly. Please try again.');
      console.error('No valid user profile selected:', viewingUserProfile);
      return;
    }

    setIsStartingChat(true);
    try {
      const userId = viewingUserProfile.userId;
      let targetUser = users.find((u) => u._id === userId);

      if (!targetUser) {
        targetUser = await fetchUserDetails(userId);
        setUsers((prev) => [...prev, targetUser]);
      }

      const existingChatId = await checkExistingChat(userId);

      setSelectedUser(targetUser);
      setSelectedGroup(null);
      setViewingUserProfile(null);
      setShowProfile(false);
      setSidebarOpen(false);
      setUnreadCounts((prev) => ({
        ...prev,
        [[currentUser.userId, userId].sort().join('-')]: 0,
      }));

      if (existingChatId) {
        socketInstance?.emit('joinChat', existingChatId);
        await fetchMessages();
      } else {
        setMessages([]);
        const newChatId = [currentUser.userId, userId].sort().join('-');
        socketInstance?.emit('joinChat', newChatId);
      }

      toast.success('Chat opened successfully');
    } catch (err) {
      console.error('Error starting chat:', err);
      toast.error(err.message || 'Failed to start chat');
      setSelectedUser(null);
    } finally {
      setIsStartingChat(false);
    }
  };

  const joinGroup = async (groupId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.post(
        `${Base_Url}/groups/${groupId}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setGroups((prev) => [...prev, res.data]);
      setAllGroups((prev) => prev.filter((group) => group._id !== groupId));
      toast.success('Joined group successfully');
    } catch (err) {
      console.error('Join group error:', err);
      toast.error(err.response?.data?.error || 'Failed to join group');
    }
  };

  const createGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      if (!groupName.trim()) throw new Error('Group name is required');
      if (groupMembers.length === 0) throw new Error('Select at least one member');
      const res = await axios.post(
        `${Base_Url}/groups`,
        { name: groupName, memberIds: groupMembers },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setGroups((prev) => [...prev, res.data]);
      setGroupName('');
      setGroupMembers([]);
      setShowCreateGroupModal(false);
      toast.success('Group created successfully');
    } catch (err) {
      console.error('Create group error:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to create group');
    }
  };

  const updateGroupPicture = async (groupId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      if (!groupPictureFile) throw new Error('No file selected');
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(groupPictureFile.type)) {
        throw new Error('Only JPG, PNG, or GIF files are allowed');
      }
      if (groupPictureFile.size > 3 * 1024 * 1024) {
        throw new Error('Image size must be less than 3MB');
      }

      const reader = new FileReader();
      reader.readAsDataURL(groupPictureFile);
      const base64Image = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read group picture'));
      });

      const formData = {
        profilePicture: base64Image,
      };

      const res = await axios.put(`${Base_Url}/groups/${groupId}/update`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const newPictureUrl = `${res.data.profilePicture}?t=${Date.now()}`;
      setGroups((prev) =>
        prev.map((g) => (g._id === groupId ? { ...g, profilePicture: newPictureUrl } : g))
      );
      if (selectedGroup && selectedGroup._id === groupId) {
        setSelectedGroup((prev) => ({ ...prev, profilePicture: newPictureUrl }));
      }
      setGroupPictureFile(null);
      toast.success('Group picture updated successfully');
    } catch (err) {
      console.error('Group picture update error:', err);
      const errorMessage =
        err.response?.status === 413
          ? 'Image too large. Please use an image smaller than 3MB.'
          : err.response?.status === 400
          ? err.response?.data?.error || 'Invalid input. Please check the file.'
          : err.response?.status === 403
          ? 'Only the group owner can update the picture.'
          : err.response?.data?.error || err.message || 'Failed to update group picture';
      toast.error(errorMessage);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const formData = {
        username: profileForm.username,
        email: profileForm.email,
        bio: profileForm.bio,
      };
      if (profileForm.password) {
        formData.password = profileForm.password;
      }
      if (profilePictureFile) {
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(profilePictureFile.type)) {
          throw new Error('Only JPG, PNG, or GIF files are allowed');
        }
        if (profilePictureFile.size > 3 * 1024 * 1024) {
          throw new Error('Image size must be less than 3MB');
        }
        const reader = new FileReader();
        reader.readAsDataURL(profilePictureFile);
        await new Promise((resolve, reject) => {
          reader.onload = () => {
            formData.profilePicture = reader.result;
            resolve();
          };
          reader.onerror = () => reject(new Error('Failed to read profile picture'));
        });
      }
      const res = await axios.put(`${Base_Url}/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      setCurrentUser({ ...currentUser, username: res.data.username, profilePicture: res.data.profilePicture });
      setProfilePictureFile(null);
      setShowProfile(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Profile update error:', err.response?.data || err.message);
      toast.error(
        err.response?.status === 413
          ? 'Image too large. Please use an image smaller than 3MB.'
          : err.response?.data?.error || err.message || 'Failed to update profile'
      );
    }
  };

  const sendMessage = async () => {
    if (!content.trim() && !selectedFile) {
      toast.warn('Message or file cannot be empty');
      return;
    }
    if (!currentUser?.userId || (!selectedUser && !selectedGroup)) {
      toast.error('No user or group selected');
      return;
    }
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    let fileUrl = '';
    let fileType = '';
    let fileName = '';
    try {
      let messageId;
      if (selectedFile) {
        if (!['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(selectedFile.type)) {
          throw new Error('Only JPG, PNG, GIF, or PDF files are allowed');
        }
        if (selectedFile.size > 10 * 1024 * 1024) {
          throw new Error('File size must be less than 10MB');
        }
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        const base64File = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Failed to read file'));
        });
        const payload = {
          file: base64File,
          fileType: selectedFile.type,
          fileName: selectedFile.name,
          content: content.trim(),
        };
        if (selectedUser) {
          payload.chatId = chatId;
        } else if (selectedGroup) {
          payload.groupId = selectedGroup._id;
        }
        const res = await axios.post(`${Base_Url}/messages/upload`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        fileUrl = res.data.fileUrl;
        fileType = res.data.fileType;
        fileName = res.data.fileName;
        messageId = res.data._id;
        setTempMessageIds((prev) => ({ ...prev, [tempId]: messageId }));
      } else {
        const payload = { content: content.trim() };
        if (selectedUser) {
          payload.chatId = chatId;
          const res = await axios.post(`${Base_Url}/messages`, payload, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          fileUrl = res.data.fileUrl || '';
          fileType = res.data.fileType || '';
          fileName = res.data.fileName || '';
          messageId = res.data._id;
          setTempMessageIds((prev) => ({ ...prev, [tempId]: messageId }));
        } else if (selectedGroup) {
          payload.groupId = selectedGroup._id;
          const res = await axios.post(`${Base_Url}/groups/${selectedGroup._id}/messages`, payload, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          fileUrl = res.data.fileUrl || '';
          fileType = res.data.fileType || '';
          fileName = res.data.fileName || '';
          messageId = res.data._id;
          setTempMessageIds((prev) => ({ ...prev, [tempId]: messageId }));
        }
      }
      if (selectedUser) {
        setMessages((prev) => [
          ...prev,
          {
            _id: tempId,
            sender: {
              _id: currentUser.userId,
              username: currentUser.username,
              profilePicture: currentUser.profilePicture,
            },
            content,
            fileUrl,
            fileType,
            fileName,
            timestamp: new Date().toISOString(),
            readBy: [{ _id: currentUser.userId }],
            chatId,
          },
        ]);
      } else if (selectedGroup) {
        setMessages((prev) => [
          ...prev,
          {
            _id: tempId,
            sender: {
              _id: currentUser.userId,
              username: currentUser.username,
              profilePicture: currentUser.profilePicture,
            },
            content,
            fileUrl,
            fileType,
            fileName,
            timestamp: new Date().toISOString(),
            readBy: [{ _id: currentUser.userId }],
            group: selectedGroup._id,
          },
        ]);
      }
      setContent('');
      setSelectedFile(null);
      setShowEmojiPicker(false);
      toast.success('Message sent');
    } catch (err) {
      console.error('Send message error:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setTempMessageIds((prev) => {
        const newTempIds = { ...prev };
        delete newTempIds[tempId];
        return newTempIds;
      });
    } finally {
      setSending(false);
    }
  };

  const renderMessage = (msg) => {
    const isCurrentUser = msg.sender._id === currentUser?.userId;
    const fileTypeLabel = msg.fileType
      ? msg.fileType.startsWith('image')
        ? 'Image'
        : msg.fileType.split('/')[1].toUpperCase()
      : '';
    return (
      <div key={msg._id} className={`flex mb-3 w-full px-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
        {!isCurrentUser && (
          <img
            src={msg.sender?.profilePicture || defaultProfilePicture}
            alt={msg.sender?.username || 'Unknown'}
            className="w-7 h-7 rounded-full mr-2 mt-1 border-2 border-amber-500"
            onError={(e) => {
              e.target.src = defaultProfilePicture;
            }}
          />
        )}
        <div
          className={`p-2 rounded-lg max-w-[75%] sm:max-w-[70%] ${
            isCurrentUser ? 'bg-blue-500 text-white rounded-lg rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-lg rounded-tl-none'
          } shadow-sm`}
        >
          {!isCurrentUser && (
            <div className="text-xs font-semibold text-teal-600 mb-1">{msg.sender?.username || 'Unknown'}</div>
          )}
          {msg.content && <p className="text-xs sm:text-sm break-words">{msg.content}</p>}
          {msg.fileUrl && msg.fileType && (
            <div className="mt-1">
              {msg.fileType.startsWith('image') ? (
                <div className="flex flex-col gap-1">
                  <div
                    className="cursor-pointer"
                    onClick={() => setPreviewImage(msg.fileUrl)}
                  >
                    <img
                      src={msg.fileUrl}
                      alt={`Sent ${fileTypeLabel}`}
                      className="max-w-[150px] sm:max-w-[200px] rounded-lg border border-teal-300"
                      onError={(e) => {
                        e.target.src = defaultProfilePicture;
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] sm:text-xs opacity-75 truncate">
                      {fileTypeLabel} {msg.fileName ? `(${msg.fileName})` : ''}
                    </p>
                    <a
                      href={msg.fileUrl}
                      download={msg.fileName || `image.${msg.fileType.split('/')[1]}`}
                      className="text-teal-500 hover:text-teal-400"
                      title="Download Image"
                    >
                      <FiDownload size={16} />
                    </a>
                  </div>
                </div>
              ) : (
                <a
                  href={msg.fileUrl}
                  download={msg.fileName || `file.${msg.fileType.split('/')[1]}`}
                  className="flex items-center gap-2 text-teal-500 hover:text-teal-400 text-xs sm:text-sm bg-teal-100 p-1 sm:p-2 rounded-lg"
                >
                  <FiFile size={16} />
                  <span className="truncate">
                    {msg.fileName || `Download ${fileTypeLabel} File`} ({fileTypeLabel})
                  </span>
                </a>
              )}
            </div>
          )}
          <div className={`text-[10px] sm:text-xs opacity-75 mt-1 flex items-center ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {isCurrentUser && msg.readBy?.length > 0 && (
              <span className="ml-1">{msg.readBy.length > 1 ? '✓✓' : '✓'}</span>
            )}
          </div>
        </div>
        {isCurrentUser && (
          <img
            src={msg.sender?.profilePicture || defaultProfilePicture}
            alt={msg.sender?.username || 'You'}
            className="w-7 h-7 rounded-full ml-2 mt-1 border-2 border-amber-500"
            onError={(e) => {
              e.target.src = defaultProfilePicture;
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-teal-500 font-sans overflow-x-hidden">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} limit={1} className="z-50" />
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-[90vw] max-h-[90vh]">
            <img
              src={previewImage}
              alt="Image Preview"
              className="w-full h-auto max-h-[90vh] rounded-lg object-contain"
              onError={() => setPreviewImage(null)}
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-400 transition-colors min-w-[44px] min-h-[44px]"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
      )}
      <button
        className="md:hidden fixed top-3 left-3 p-2 bg-amber-500 text-teal-900 rounded-lg shadow-md hover:bg-amber-400 transition-colors z-50 min-w-[44px] min-h-[44px] text-sm"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <FiX size={20} /> : 'Menu'}
      </button>
      <div
        className={`fixed md:static inset-y-0 left-0 w-72 sm:w-80 md:w-1/3 lg:w-1/4 bg-teal-800 text-white p-4 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 h-screen overflow-y-auto z-40 shadow-lg`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-amber-500">Chats</h2>
          <button
            onClick={logout}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-400 transition-colors shadow-sm min-w-[44px] min-h-[44px]"
            title="Logout"
          >
            <FiLogOut size={18} />
          </button>
        </div>
        <div className="mb-4 p-4 bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl shadow-md hover:shadow-lg flex items-center transition-all">
          <img
            src={profile.profilePicture || defaultProfilePicture}
            alt="Profile"
            className="w-12 h-12 rounded-full mr-3 border-2 border-amber-400 hover:ring-2 hover:ring-amber-300 hover:scale-105 transition-all"
            onError={(e) => (e.target.src = defaultProfilePicture)}
          />
          <div className="flex-1 space-y-1">
            <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600 drop-shadow-sm">
              {profile.username || 'No username'}
            </h3>
            <p className="text-teal-400 text-xs truncate max-w-[150px]">{profile.email || 'No email'}</p>
            <p className="text-teal-400 text-xs truncate max-w-[150px]">{profile.bio || 'No bio set'}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowProfile(true);
            setViewingUserProfile(null);
            setSelectedUser(null);
            setSelectedGroup(null);
            setSidebarOpen(false);
          }}
          className="mb-4 w-full p-2 bg-amber-500 text-teal-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors shadow-md text-sm"
        >
          {profile.profilePicture ? 'Edit Profile' : 'Add Profile Picture'}
        </button>
        <div className="mb-4">
          <h3 className="text-base font-semibold mb-2 text-amber-500">Groups</h3>
          <button
            onClick={() => {
              setShowCreateGroupModal(true);
              setSidebarOpen(false);
            }}
            className="w-full p-2 bg-amber-500 text-teal-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors shadow-md mb-2 text-sm"
          >
            Create New Group
          </button>
          <ul className="space-y-2">
            {groups.map((group) => (
              <li
                key={group._id}
                className={`p-3 rounded-xl cursor-pointer hover:bg-teal-600 flex items-center justify-between ${
                  selectedGroup?._id === group._id ? 'bg-teal-500 shadow-md ring-1 ring-teal-500/20' : ''
                } transition-all`}
                onClick={() => {
                  setSelectedGroup(group);
                  setSelectedUser(null);
                  setShowProfile(false);
                  setViewingUserProfile(null);
                  setSidebarOpen(false);
                  setShowGroupMembers(false);
                }}
              >
                <div className="flex items-center space-x-2 max-w-[70%]">
                  <img
                    src={group.profilePicture || defaultProfilePicture}
                    alt={group.name}
                    className="w-8 h-8 rounded-full mr-2 border-2 border-amber-400 hover:ring-2 hover:ring-amber-300 transition-all"
                    key={group.profilePicture || group._id}
                    onError={(e) => (e.target.src = defaultProfilePicture)}
                  />
                  <span className="text-white font-semibold truncate text-sm">{group.name}</span>
                  {currentUser?.userId && group.ownerId === currentUser.userId && (
                    <span
                      className="ml-2 bg-gradient-to-r from-amber-400 to-amber-600 text-gray-900 text-[10px] font-semibold px-2 py-1 rounded-full shadow-sm"
                      title="You are the group owner"
                    >
                      Owner
                    </span>
                  )}
                </div>
                {unreadCounts[group._id] > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 animate-pulse">
                    {unreadCounts[group._id]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="mb-4 p-3 bg-teal-800/50 rounded-xl shadow-sm">
          <h3 className="text-base font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600 drop-shadow-sm">
            Join Group
          </h3>
          <ul className="space-y-2">
            {allGroups.map((group) => (


<li
  key={group._id}
  className={`p-2.5 rounded-xl flex items-center justify-between gap-3 hover:bg-teal-600/80 transition-all duration-200 ${
    selectedGroup?._id === group._id ? 'bg-teal-500/90 shadow-md ring-1 ring-teal-400/30' : 'bg-teal-700/40'
  }`}
>
  {/* Group Info (Left Side) */}
  <div 
    className="flex items-center min-w-0 gap-2 flex-1 cursor-pointer"
    onClick={() => {
      setSelectedGroup(group);
      setSelectedUser(null);
      setShowProfile(false);
      setSidebarOpen(false);
    }}
  >
    <img
      src={group.profilePicture || defaultProfilePicture}
      alt={group.name}
      className="w-9 h-9 rounded-full border-2 border-amber-400/80 hover:ring-2 hover:ring-amber-300/50 transition-all shrink-0"
      key={group.profilePicture || group._id}
      onError={(e) => (e.target.src = defaultProfilePicture)}
    />
    
    <div className="min-w-0">
      <p className="text-white font-medium text-sm truncate">
        {group.name}
      </p>
      {/* Optional: Add member count or other metadata */}
      {/* <p className="text-teal-200/80 text-xs truncate">12 members</p> */}
    </div>
  </div>

  {/* Join Button */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      joinGroup(group._id);
    }}
    className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-600 text-gray-900 font-semibold rounded-lg hover:from-amber-300 hover:to-amber-500 text-xs transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center whitespace-nowrap"
    aria-label={`Join ${group.name}`}
  >
    Join Group
  </button>
</li>

            ))}
          </ul>
        </div>
        <h3 className="text-base font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600 drop-shadow-sm">
          Users
        </h3>
        <ul className="space-y-2">
          {users.map((user) => {
            const chatId = [currentUser?.userId, user._id].sort().join('-');
            return (


<li
  key={user._id}
  className={`p-2.5 rounded-xl cursor-pointer hover:bg-teal-600/80 flex items-center gap-3 ${
    selectedUser?._id === user._id 
      ? 'bg-teal-500/90 shadow-md ring-1 ring-teal-400/30' 
      : 'bg-teal-700/40'
  } transition-all duration-200`}
>
  {/* User Info (Left Side) */}
  <div
    onClick={() => {
      setSelectedUser(user);
      setSelectedGroup(null);
      setShowProfile(false);
      setViewingUserProfile(null);
      setSidebarOpen(false);
    }}
    className="flex items-center flex-1 min-w-0 gap-2"
  >
    <img
      src={user.profilePicture || defaultProfilePicture}
      alt={user.username}
      className="w-9 h-9 rounded-full border-2 border-amber-400/80 hover:ring-2 hover:ring-amber-300/50 transition-all shrink-0"
      onError={(e) => (e.target.src = defaultProfilePicture)}
    />
    
    <div className="flex flex-col min-w-0">
      <div className="flex items-baseline gap-1.5">
        <span className="text-white font-medium text-sm truncate">
          {user.username}
        </span>
        <span className={`text-[10px] ${user.online ? 'text-amber-300' : 'text-teal-300/80'}`}>
          {user.online ? 'Online' : 'Offline'}
        </span>
      </div>
      {/* You could add a status message or last seen time here */}
    </div>
  </div>

  {/* Right Side Actions */}
  <div className="flex items-center gap-2">
  
    
    {/* Profile Button */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        viewUserProfile(user._id);
        setSidebarOpen(false);
      }}
      className="px-3 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 hover:text-amber-200 rounded-lg text-xs transition-all flex items-center justify-center"
      aria-label="View profile"
    >
      View
    </button>

       {/* Unread Count Badge */}
       {unreadCounts[chatId] > 0 && (
      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
        {unreadCounts[chatId]}
      </span>
    )}
  </div>
</li>



            );
          })}
        </ul>
      </div>
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-teal-800 p-4 rounded-xl shadow-2xl w-full max-w-[90vw] sm:max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold text-amber-500 mb-3">Create New Group</h3>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full p-2 rounded-lg bg-teal-700 text-white placeholder-teal-300 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-3 text-sm"
            />
            <div className="mb-3">
              <label className="block text-teal-300 font-semibold mb-1 text-sm">Select Members</label>
              <div className="max-h-32 overflow-y-auto bg-teal-700 rounded-lg p-2">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center p-2 hover:bg-teal-600 rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      value={user._id}
                      checked={groupMembers.includes(user._id)}
                      onChange={(e) => {
                        const userId = e.target.value;
                        setGroupMembers((prev) =>
                          prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
                        );
                      }}
                      className="mr-2 h-4 w-4 text-amber-500 focus:ring-amber-500 border-teal-300 rounded"
                    />
                    <img
                      src={user.profilePicture || defaultProfilePicture}
                      alt={user.username}
                      className="w-6 h-6 rounded-full mr-2 border border-amber-500"
                      onError={(e) => (e.target.src = defaultProfilePicture)}
                    />
                    <span className="text-white text-xs">{user.username}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createGroup}
                className="flex-1 p-2 bg-amber-500 text-teal-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors shadow-md text-sm min-h-[44px]"
              >
                Create Group
              </button>
              <button
                onClick={() => {
                  setShowCreateGroupModal(false);
                  setGroupName('');
                  setGroupMembers([]);
                }}
                className="flex-1 p-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-500 transition-colors shadow-md text-sm min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col bg-teal-100 min-h-screen ">
        {showProfile ? (
          <div className="p-3 sm:p-4">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-teal-800 text-center">Edit Your Profile</h2>
            <form onSubmit={updateProfile} className="w-full max-w-[90vw] sm:max-w-md mx-auto">
              <div className="mb-3">
                <label className="block text-teal-700 font-semibold mb-1 text-sm">Profile Picture</label>
                <div className="flex items-center">
                  <img
                    src={profilePictureFile ? URL.createObjectURL(profilePictureFile) : profile.profilePicture || defaultProfilePicture}
                    alt="Profile Preview"
                    className="w-14 h-14 rounded-full mr-3 border-2 border-amber-500"
                    onError={(e) => (e.target.src = defaultProfilePicture)}
                  />
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={(e) => setProfilePictureFile(e.target.files[0])}
                      className="text-teal-700 text-xs w-full"
                    />
                    {profilePictureFile && (
                      <button
                        type="button"
                        onClick={() => setProfilePictureFile(null)}
                        className="mt-1 text-xs text-red-500 hover:text-red-400"
                      >
                        Remove Picture
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-teal-700 font-semibold mb-1 text-sm">Username</label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  className="w-full p-2 rounded-lg bg-white text-teal-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-teal-700 font-semibold mb-1 text-sm">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full p-2 rounded-lg bg-white text-teal-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-teal-700 font-semibold mb-1 text-sm">Bio</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full p-2 rounded-lg bg-white text-teal-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  rows="3"
                />
              </div>
              <div className="mb-3">
                <label className="block text-teal-700 font-semibold mb-1 text-sm">Password (optional)</label>
                <input
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                  className="w-full p-2 rounded-lg bg-white text-teal-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  className="p-2 bg-amber-500 text-teal-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors flex-1 shadow-md text-sm min-h-[44px]"
                >
                  Save Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    setProfilePictureFile(null);
                  }}
                  className="p-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-500 transition-colors flex-1 shadow-md text-sm min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : viewingUserProfile ? (
          <div className="p-3 sm:p-4">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-teal-800 text-center">{viewingUserProfile.username}'s Profile</h2>
            <div className="w-full max-w-[90vw] sm:max-w-md mx-auto bg-white p-4 rounded-lg shadow-md">
              <img
                src={viewingUserProfile.profilePicture || defaultProfilePicture}
                alt={viewingUserProfile.username}
                className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-amber-500"
                onError={(e) => (e.target.src = defaultProfilePicture)}
              />
              <p className="text-teal-700 font-semibold text-center text-sm">
                Username: <span className="font-normal">{viewingUserProfile.username}</span>
              </p>
              <p className="text-teal-700 font-semibold mt-2 text-center text-sm">
                Email: <span className="font-normal">{viewingUserProfile.email}</span>
              </p>
              <p className="text-teal-700 font-semibold mt-2 text-center text-sm">
                Bio: <span className="font-normal">{viewingUserProfile.bio || 'No bio set'}</span>
              </p>
              <button
                onClick={startChatWithUser}
                disabled={isStartingChat}
                className={`mt-3 w-full p-2 bg-amber-500 text-teal-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors shadow-md text-sm min-h-[44px] ${
                  isStartingChat ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isStartingChat ? 'Starting Chat...' : 'Start Chat'}
              </button>
              <button
                onClick={() => {
                  setViewingUserProfile(null);
                  setSidebarOpen(true);
                }}
                className="mt-2 w-full p-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-500 transition-colors shadow-md text-sm min-h-[44px]"
              >
                Back
              </button>
            </div>
          </div>
        ) : selectedUser || selectedGroup ? (
 
<>
    <div className="p-3 sm:p-4 flex items-center justify-between bg-teal-700 text-white shadow-md">
        <div className="flex items-center">
                <img
                  src={selectedUser ? selectedUser.profilePicture : selectedGroup.profilePicture || defaultProfilePicture}
                  alt={selectedUser ? selectedUser.username : selectedGroup.name}
                  className="w-10 h-10 rounded-full mr-3 border-2 border-amber-500"
                  onError={(e) => (e.target.src = defaultProfilePicture)}
                />
                <div>
                  <h2 className="text-base sm:text-lg font-bold">
                    {selectedUser ? selectedUser.username : selectedGroup.name}
                  </h2>
                  {selectedUser && (
                    <span className={`text-xs ${selectedUser.online ? 'text-amber-400' : 'text-teal-300'}`}>
                      {selectedUser.online ? 'Online' : 'Offline'}
                    </span>
                  )}
                </div>
              </div>
      {selectedGroup && (
          <div className="flex gap-2">
          {currentUser?.userId === selectedGroup.ownerId && (
            <div className="flex items-center">
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={(e) => setGroupPictureFile(e.target.files[0])}
                className="hidden"
                id="group-picture-upload"
              />
              <label
                htmlFor="group-picture-upload"
                className="p-2 bg-amber-500 text-teal-900 rounded-lg hover:bg-amber-400 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Update Group Picture"
              >
                <FiEdit size={18} />
              </label>
              {groupPictureFile && (
                <button
                  onClick={() => updateGroupPicture(selectedGroup._id)}
                  className="ml-2 p-2 bg-amber-500 text-teal-900 rounded-lg hover:bg-amber-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  Save
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => setShowGroupMembers(!showGroupMembers)}
            className="p-2 bg-amber-500 text-teal-900 rounded-lg hover:bg-amber-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="View Group Members"
          >
            <FiUsers size={18} />
          </button>
        </div>

      )}
    </div>
    {selectedGroup && showGroupMembers && (
<div className="bg-teal-100 p-3 border-b border-teal-200      mx-3 sm:mx-4  max-h-40 overflow-y-auto">
<h3 className="text-teal-800 font-semibold mb-2 text-sm">Group Members</h3>
<ul className="space-y-2">
  {selectedGroup.members.map((member) => (
    <li
      key={member._id}
      className="flex items-center p-2 hover:bg-teal-200 rounded-lg transition-colors cursor-pointer"
      onClick={() => viewUserProfile(member._id)}
    >
      <img
        src={member.profilePicture || defaultProfilePicture}
        alt={member.username}
        className="w-8 h-8 rounded-full mr-2 border-2 border-amber-500"
        onError={(e) => (e.target.src = defaultProfilePicture)}
      />
      <span className="text-teal-900 text-sm">{member.username}</span>
      {member._id === selectedGroup.ownerId && (
        <span className="ml-2 bg-amber-500 text-teal-900 text-[10px] font-semibold px-2 py-1 rounded-full">
          Owner
        </span>
      )}
    </li>
  ))}
</ul>
</div>
    )}


    <div className="flex-1 bg-teal-50 rounded-t-lg p-3 sm:p-4 overflow-y-auto max-h-[calc(100vh-160px)] sm:max-h-[calc(100vh-180px)] shadow-inner">
      {messages.length === 0 ? (
        <p className="text-teal-700 text-center text-sm">No messages yet</p>
      ) : (
        messages.map(renderMessage)
      )}
      <div ref={messagesEndRef} />
    </div>

     <div className="p-3 bg-teal-100 border-t border-teal-200 relative">
              {selectedFile && (
                <div className="mb-2 p-2 bg-teal-200 rounded-lg flex items-center justify-between">
                  <span className="text-teal-900 text-xs truncate max-w-[70%]">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-red-500 hover:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <FiSmile size={18} />
                </button>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <FiPaperclip size={18} />
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 rounded-lg bg-white text-teal-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none"
                  rows="2"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending}
                  className={`p-2 bg-amber-500 text-teal-900 rounded-lg hover:bg-amber-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                    sending ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FiSend size={18} />
                </button>
              </div>
              {showEmojiPicker && (
                <div className="absolute bottom-16 left-3 z-50">
                  <EmojiPicker
                    onEmojiClick={(emojiObject) => setContent((prev) => prev + emojiObject.emoji)}
                    width={300}
                    height={400}
                  />
                </div>
              )}
            </div>
            </>

        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-teal-600 text-sm sm:text-base text-center px-4">
              Select a user or group to start chatting!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;