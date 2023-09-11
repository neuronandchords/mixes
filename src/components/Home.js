import React, { useEffect, useState } from 'react';
import {
  ChakraProvider,
  Box,
  Text,
  Link,
  VStack,
  Code,
  Grid,
  theme,
  HStack,
  Image,
  Flex,
  Input,
  InputGroup,
  Stack,
  InputRightAddon,
  border,
  Spacer,
  Spinner,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { ColorModeSwitcher } from '../ColorModeSwitcher.js';
import { FaStopCircle, FaPlayCircle, FaSpotify } from 'react-icons/fa';
import { AiFillMinusCircle } from 'react-icons/ai';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { SpotifyAuth, Scopes } from 'react-spotify-auth';

function Home() {
  const [prompt, setPrompt] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [playlist, setPlaylist] = useState([]);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [loadingMix, setLoadingMix] = useState(false);
  const [currentPlaying, setCurrentPlaying] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState([]);
  const [loggingIn, setloggingIn] = useState(false);
  const [currentAlbum, setCurrentAlbum] = useState(
    'https://plus.unsplash.com/premium_photo-1682125488670-29e72e5a7672?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2788&q=80'
  );
  const [spotifyPlaylistId, setSpotifyPlaylistId] = useState(null);

  const [addingPlaylist, setAddingPlaylist] = useState(false);

  const access_token = useSelector((state) => state.auth.access_token);

  const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token'))

  const [lastExecuted, setLastExecuted] = useState(null)

  const [mixTitle, setMixTitle] = useState(null);

  const [loggedIn, setLoggedIn] = useState(false);

  let hasExecuted = false;

  useEffect(() => {

    if (playlist.length>0){
      generatePlaylist(localStorage.getItem('access_token'));
    }

  },[loggedIn])
  
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

window.addEventListener('storage', (event) => {
    console.log('evnettt');
    setLoggedIn(true);
},{once:true});



  const playlistAdded = () =>
    toast(
      <Flex gap={2} textAlign={'center'} align={'center'}>
        <FaSpotify color={'#1DB954'} />
        <Text>Your mix has been added to Spotify!</Text>
      </Flex>
    );

  const handleLogin = () => {
    setAddingPlaylist(true);
    if (localStorage.getItem('access_token')) {
      generatePlaylist(localStorage.getItem('access_token'));
      return;
    }

    const clientId = '9cf715547e7245ab8b2154081eeab4cf';
    const redirectUri = 'http://localhost:3000/auth';
    const scope = [
      'user-read-private user-read-email',
      'playlist-modify-public',
    ]; // Add required scopes
    window.open(
      `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token&show_dialog=true`,
      '_blank'
    );
  };

  const generatePlaylist = token => {
      axios
      .get('https://api.spotify.com/v1/me', {
        headers: {
          'Content-Type': 'application/json', // Specify that the request body is JSON
          Authorization: `Bearer ${token}`,
        },
      })
      .then(response => {
        axios
          .post(
            `https://api.spotify.com/v1/users/${response.data.id}/playlists`,
            {
              name: prompt,
              public: true,
              description: 'created using mixes.musixspace.com',
            },
            {
              headers: {
                'Content-Type': 'application/json', // Specify that the request body is JSON
                Authorization: `Bearer ${token}`,
              },
            }
          )
          .then(response => {
            setSpotifyPlaylistId(response.data.external_urls.spotify);
            axios
              .post(
                `https://api.spotify.com/v1/playlists/${response.data.id}/tracks`,
                {
                  position: 0,
                  uris: playlist.map(item => item.uri),
                },
                {
                  headers: {
                    'Content-Type': 'application/json', // Specify that the request body is JSON
                    Authorization: `Bearer ${token}`,
                  },
                }
              )
              .then(response => {
                setAddingPlaylist(false);
                playlistAdded();
                onClose();
              })
              .catch(err => {
                console.log('error in fetching data');
              });
          })
          .catch(err => {
            console.log('error in fetching data');
          });
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
            localStorage.clear('access_token');
            handleLogin()
        }
      });
  };

  const generateMix = () => {
    setLoadingMix(true);
    setSpotifyPlaylistId(null);
    setMixTitle(prompt);
    setCurrentTrack(null);
    axios
      .post(
        'http://127.0.0.1:5000/',
        {
          prompt: prompt,
        },
        {
          headers: {
            'Content-Type': 'application/json', // Specify that the request body is JSON
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
      .then(response => {
        setPlaylist(response.data.results);
        setLoadingMix(false);
        setCurrentAlbum(response.data.results[0].img_url);
        setCurrentTrack(response.data.results[0])
        setCurrentIndex(0);
      })
      .catch(err => {
        setLoadingMix(false);
      });
  };

  window.addEventListener("ended", (event) => { console.log('stopped');setAudioPlaying(false)});

  const toggleAudio = (track, idx) => {
    setCurrentAlbum(track.img_url);
    setCurrentTrack(track);
    var audio_element = document.getElementsByClassName('current-playing')[0];
    if (currentIndex === idx){
      setCurrentIndex(idx);
      audio_element.src = track.preview_url;
      audioPlaying ? audio_element.pause() : audio_element.play();
      setAudioPlaying(!audioPlaying);
    }
    else{
      setCurrentIndex(idx);
      audio_element.src = track.preview_url;
      audio_element.play();
      setAudioPlaying(true);
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Toaster
        toastOptions={{
          // Define default options
          className: '',
          duration: 5000,
          style: {
            background: '#ffffff',
            color: '#000',
            fontWeight: '500',
          },
        }}
      />
      <Box bgGradient="linear(to-r,#16032F, #000000)">
        <Flex wrap={['wrap','wrap','nowrap','nowrap','nowrap']} p={12} gap={48} direction={'row'}>
          <Box
            h="100vh"
            overflow={'scroll'}
            gap={24}
            textAlign={'left'}
            w={["100%","100%","70%","60%","60%"]}
          >
            <Text fontSize={['3xl','3xl','3xl','6xl','6xl']} fontWeight={'800'} color="#F59C24">
              Mixes
            </Text>
            <VStack textAlign={'left'} marginTop={[10,10,16]} spacing={['54px','64px']}>
              <Text fontSize={['2xl','2xl','2xl','5xl','5xl']} fontWeight={'bold'} color="#FFFFFF">
                Find soundtracks for your feels & remix w/ friends
              </Text>
              <Stack w={'100%'} spacing={4}>
                <InputGroup border={'2px solid #FFFFFF'} borderRadius={48}>
                  <Input
                    onChange={e => setPrompt(e.target.value)}
                    value={prompt}
                    _activeLink={{ border: 'transperant' }}
                    border={'transparent'}
                    w={'100%'}
                    fontWeight={'700'}
                    textColor={'#F59C24'}
                    fontSize={['lg','lg','2xl','2xl','2xl']}
                    p={[6,6,8]}
                    placeholder="Enter your moment here"
                  />
                  <InputRightAddon
                    _hover={{ pointerEvents: 'drag' }}
                    alignSelf={'center'}
                    border={'transparent'}
                    backgroundColor={'transparent'}
                  >
                    {loadingMix ? (
                      <Spinner color="#F59C24" />
                    ) : (
                      <FaPlayCircle
                        onClick={generateMix}
                        size={28}
                        cursor={'pointer'}
                        color="#F59C24"
                      />
                    )}
                  </InputRightAddon>
                </InputGroup>
              </Stack>
            </VStack>
            <Flex
              flexWrap={'wrap'}
              direction={'row'}
              gap={'24px'}
              marginTop={'24px'}
              display={playlist && playlist.length < 1 & !loadingMix ? 'flex' : 'none'}
            >
              <Text
                border={'2px solid #ffffff'}
                borderRadius={'64px'}
                fontSize={['sm','sm','xl','xl','xl']}
                p={['14px','14px','18px']}
                cursor={'pointer'}
                fontWeight={'800'}
                color="#AC91C1"
                onClick={e => setPrompt('happy goofy in love')}
              >
                happy goofy in love
              </Text>
              <Text
                border={'2px solid #ffffff'}
                borderRadius={'64px'}
                fontSize={['sm','sm','xl','xl','xl']}
                p={['14px','14px','18px']}
                fontWeight={'800'}
                cursor={'pointer'}
                color="#AC91C1"
                onClick={e => setPrompt('head banging rock like nirvana')}
              >
                head banging rock like nirvana
              </Text>
              <Text
                border={'2px solid #ffffff'}
                borderRadius={'64px'}
                fontSize={['sm','sm','xl','xl','xl']}
                p={['14px','14px','18px']}
                fontWeight={'800'}
                cursor={'pointer'}
                color="#AC91C1"
                onClick={e => setPrompt('prom night in highschool')}
              >
                prom night in highschool
              </Text>
              <Text
                border={'2px solid #ffffff'}
                borderRadius={'64px'}
                fontSize={['sm','sm','xl','xl','xl']}
                p={['14px','14px','18px']}
                fontWeight={'800'}
                cursor={'pointer'}
                color="#AC91C1"
                onClick={e => setPrompt('full energy roadtrip feels')}
              >
                full energy roadtrip feels
              </Text>
            </Flex>
            <Flex marginTop={'4px'} marginBottom={'4px'}>
              <Text
                marginTop={'48px'}
                marginBottom={'24px'}
                fontSize={['2xl','2xl','2xl','2xl','2xl']}
                fontWeight={'bold'}
                color="#FFFFFF"
                display={playlist && playlist.length > 0 ? 'block' : 'none'}
              >
                {mixTitle}
                <Spacer />
                {spotifyPlaylistId ? (
                  <Button
                    onClick={e => window.open(spotifyPlaylistId, '_blank')}
                    borderRadius={'24px'}
                    marginTop={[2]}
                  >
                    <Flex textAlign={'center'} gap={2}>
                      <Text fontSize={['md','md','lg','lg','lg']}>Open in Spotify</Text>
                      <FaSpotify color={'#1DB954'} size={22} />
                    </Flex>
                  </Button>
                ) : (
                  <Button marginTop={[2]} isDisabled = { loadingMix ? true : false} onClick={localStorage.getItem('access_token') ? (()=> {setAddingPlaylist(true);generatePlaylist(localStorage.getItem('access_token'))}) : onOpen} borderRadius={'24px'}>
                    <Flex textAlign={'center'} gap={2}>
                      {addingPlaylist ? <Spinner/> : (
                        <>
                        <Text fontSize={['md','md','lg','lg','lg']}>Add to Spotify</Text>
                        <FaSpotify color={'#1DB954'} size={22} />
                        </>
                      )}
                    </Flex>
                  </Button>
                )}
                <Modal size={'md'} isOpen={isOpen} onClose={onClose}>
                  <ModalOverlay backdropFilter="blur(10px)" />
                  <ModalContent
                    width={['100%','100%','50%']}
                    h={['40%','40%','40%']}
                    bgGradient="linear(to-r,#16032F, #000000)"
                  >
                    <ModalCloseButton onClick={(e)=>setAddingPlaylist(false)} size={'lg'} color={'#F59C24'} />
                    <ModalBody
                      borderRadius={24}
                      border={'2px solid #ffffff'}
                      bgGradient="linear(to-r,#16032F, #000000)"
                    >
                      <Flex
                        gap={4}
                        direction={'column'}
                        padding={12}
                        align={'center'}
                        textAlign={'center'}
                      >
                        <Image filter = {loadingMix ? 'blur(8px)' : null} src={currentTrack && currentTrack.img_url} />
                        <Text
                          color={'#F59C24'}
                          w="100%"
                          fontSize={['lg','lg','2xl']}
                          fontWeight={'700'}
                        >
                          Connect your Spotify
                        </Text>
                        <Text
                          color={'#ffffff'}
                          w="100%"
                          fontSize={['md','md','xl']}
                          fontWeight={'500'}
                        >
                          Connect your Spotify account to add this mix to your
                          library!
                        </Text>
                        <Button
                          className='connect-spotify'
                          onClick={handleLogin}
                          marginTop={'12px'}
                          padding={'32px'}
                          borderRadius={'48px'}
                          w={'100%'}
                        >
                          {addingPlaylist ? (
                            <Spinner />
                          ) : (
                            <Flex textAlign={'center'} align={'center'} gap={4}>
                              <FaSpotify color={'#1DB954'} size={28} />
                              <Text fontSize={['md','md','2xl']}>
                                Connect with Spotify
                              </Text>
                            </Flex>
                          )}
                        </Button>
                      </Flex>
                    </ModalBody>
                  </ModalContent>
                </Modal>
              </Text>
            </Flex>
            <Flex gap={8} direction={'column'}>
              {loadingMix ? (
                <Flex
                  direction={'column'}
                  gap={4}
                  textAlign={'center'}
                  alignItems={'center'}
                  alignSelf={'center'}
                  paddingTop={'sm'}
                  marginTop={12}
                >
                  <Spinner thickness="4px" size={['lg','lg','xl','xl','xl']}color="#F59C24" />
                  <Text fontWeight={'600'} color={'#fff'} fontSize={['lg','lg','2xl','2xl','2xl']}>
                    Generating your mix..
                  </Text>
                </Flex>
              ) : (
                playlist &&
                playlist.map((track, idx) => (
                  <HStack gap={6} align={'left'}>
                    <Image
                      borderRadius={4}
                      height={'64px'}
                      width={'64px'}
                      src={track.img_url}
                    />
                    <Flex direction={'column'} align={'left'}>
                      <Text
                        fontSize={['16px','16px','18px']}
                        fontWeight={'700'}
                        color="#AC91C1"

                      >
                        {' '}
                        {track.name}
                      </Text>
                      <Text
                        fontSize={['12px','12px','14px']}
                        fontStyle={'italic'}
                        fontWeight={'700'}
                        color="#FFFFFF"
                      >
                        {track.artist}
                      </Text>
                    </Flex>
                    <Spacer />
                    <Flex
                      display={track.preview_url ? 'flex' : 'none'}
                      align="center"
                      gap={6}
                    >
                      {currentIndex === idx && audioPlaying ? (
                        <FaStopCircle
                          size={[28]}
                          cursor={'pointer'}
                          color="#F59C24"
                          onClick={e => toggleAudio(track, idx)}
                        />
                      ) : (
                        <FaPlayCircle
                          size={[28]}
                          cursor={'pointer'}
                          color="#F59C24"
                          onClick={e => toggleAudio(track, idx)}
                        />
                      )}
                      {/* <AiFillMinusCircle size={32}
                          cursor={'pointer'}
                          color="#FFF"/> */}
                    </Flex>
                  </HStack>
                ))
              )}
            </Flex>
          </Box>
          <Box alignContent={'center'} overflow="hidden" textAlign={'center'} w={["100%","100%","30%","40%","40%"]}>
            <Stack
              display={currentAlbum ? 'flex' : 'none'}
              spacing={'48px'}
              marginTop={'24px'}
              align={'center'}
            >
              <Image
                marginTop={'20%'}
                alignSelf={'center'}
                objectFit={'cover'}
                border={'2px solid #F59C24'}
                borderRadius={20}
                height='auto'
                width='auto'
                src={currentAlbum}
                alt="Dan Abramov"
              />
              <VStack>
                <Text fontSize={'24px'} fontWeight={'700'} color="#F59C24">
                  {currentTrack && currentTrack.name}
                </Text>
                <Text fontSize={'18px'} fontWeight={'600'} color="#FFFFFF">
                  {currentTrack && currentTrack.artist}
                </Text>
              </VStack>
              {/* {playlist.length > 0 ? (
                audioPlaying ? (
                  <FaStopCircle
                    size={64}
                    cursor={'pointer'}
                    color="#F59C24"
                    onClick={e => toggleAudio(currentTrack, currentIndex)}
                  />
                ) : (
                  <FaPlayCircle
                    size={64}
                    cursor={'pointer'}
                    color="#F59C24"
                    onClick={e => toggleAudio(currentTrack, currentIndex)}
                  />
                )
              ) : null} */}
              <audio
                src="https://p.scdn.co/mp3-preview/dae40905ac10cc94acd05884e318b413eb2b9b42?cid=9cf715547e7245ab8b2154081eeab4cf"
                className="current-playing"
              ></audio>
            </Stack>
          </Box>
        </Flex>
        {/* <HStack textAlign={'left'} display={'flex'} flexDirection={'column'} p={12}>
           
          </HStack> */}
      </Box>
    </ChakraProvider>
  );
}

export default Home;
