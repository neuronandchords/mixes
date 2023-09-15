import React, { useEffect, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import { Helmet } from 'react-helmet';
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
  Select,
  background,
  Editable,
  EditablePreview,
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
import {
  FaStopCircle,
  FaPlayCircle,
  FaSpotify,
  FaChevronDown,
  FaCross,
  FaWindowClose,
  FaAudioDescription,
} from 'react-icons/fa';
import { AiFillMinusCircle, AiFillCloseCircle } from 'react-icons/ai';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { SpotifyAuth, Scopes } from 'react-spotify-auth';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuGroup,
  MenuOptionGroup,
  MenuDivider,
} from '@chakra-ui/react';

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
    'https://images.unsplash.com/photo-1595177663993-4849619ab1f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHBsYXlsaXN0c3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60'
  );
  const [spotifyPlaylistId, setSpotifyPlaylistId] = useState(null);

  const [addingPlaylist, setAddingPlaylist] = useState(false);

  const access_token = useSelector(state => state.auth.access_token);

  const [accessToken, setAccessToken] = useState(
    localStorage.getItem('access_token')
  );

  const [mode, setMode] = useState('Prompts');

  const [lastExecuted, setLastExecuted] = useState(null);

  const [mixTitle, setMixTitle] = useState(null);

  const [loggedIn, setLoggedIn] = useState(false);

  const [search, setSearch] = useState(null);

  const [searchResults, setSearchResults] = useState([]);

  const [selectedItems, setSelectedItems] = useState([]);

  const [isDropOpen, setIsDropOpen] = useState(false);

  const boxRef = useRef(null);

  let hasExecuted = false;

  const customScrollbarStyles: CSSObject = {
    /* Hide scrollbar for webkit-based browsers (e.g., Chrome and Safari) */
    /* Note: You may need to adjust the colors and styles to match your design */
    '&::-webkit-scrollbar': {
      width: '0em' /* Adjust the width as needed */,
    },

    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'transparent' /* Make the thumb transparent */,
    },

    /* Hide scrollbar for Firefox */
    /* Note: This property may not be supported in all versions of Firefox */
    scrollbarWidth: 'thin' /* Adjust to 'none' or 'auto' as needed */,
  };

  useEffect(() => {
    if (playlist.length > 0) {
      generatePlaylist(localStorage.getItem('access_token'));
    }
  }, [loggedIn]);

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  window.addEventListener(
    'storage',
    event => {
      setLoggedIn(true);
    },
    { once: true }
  );

  const playlistAdded = () =>
    toast(
      <Flex gap={2} textAlign={'center'} align={'center'}>
        <FaSpotify color={'#1DB954'} />
        <Text>Your mix has been added to Spotify!</Text>
      </Flex>
    );

  const trackLimitHit = () =>
    toast(
      <Flex gap={6} textAlign={'left'} align={'center'}>
        <AiFillCloseCircle size={[26]} color={'red'} />
        <Text fontSize={['sm', 'sm', 'md']}>
          You can only add upto 5 tracks/artists for inspiration!
        </Text>
      </Flex>
    );

  const handleLogin = () => {
    setAddingPlaylist(true);
    if (localStorage.getItem('access_token')) {
      generatePlaylist(localStorage.getItem('access_token'));
      return;
    }

    const clientId = '9cf715547e7245ab8b2154081eeab4cf';
    const redirectUri = 'https://mixes.musixspace.com/auth';
    const scope = [
      'user-read-private user-read-email',
      'playlist-modify-public',
    ]; // Add required scopes
    window.open(
      `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token&show_dialog=true`,
      '_blank'
    );
  };

  const searchFromSpotify = () => {
    axios
      .post(
        `https://mixes.data.musixspace.com/search`,
        {
          q: search,
          type: mode === 'Similar Tracks' ? 'tracks' : 'artists',
        },
        {
          headers: {
            'Content-Type': 'application/json', // Specify that the request body is JSON
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
      .then(response => {
        if (mode === 'Similar Tracks' && search.length > 0) {
          const trackInfo = [];
          response.data.results.tracks.items.map(track =>
            trackInfo.push({
              name: track.name,
              uri: track.uri,
              img_url: track.album.images[0].url,
            })
          );
          setSearchResults(trackInfo);
          setIsDropOpen(true);
        } else if (mode === 'Similar Artists' && search.length > 0) {
          const artistInfo = [];
          response.data.results.artists.items.map(artist =>
            artistInfo.push({
              name: artist.name,
              img_url:
                (artist && artist.images.length > 0 && artist.images[0].url) ||
                null,
              uri: artist.uri,
            })
          );
          setSearchResults(artistInfo);
          setIsDropOpen(true);
        }
      })
      .catch(err => {
        toast.error(
          'Whoops! Our DJ got tangled in cables. Please give it another go! 🎧'
        );
      });
  };

  // useEffect(() => {
  //   searchFromSpotify(search);
  // }, [search]);

  const debouncedSearch = e => (searchFromSpotify(), 3000); // Adjust the delay (in milliseconds) as needed

  useEffect(() => {
    if ((mode !== 'Prompts') & (selectedItems.length > 0)) generateMix();
  }, [selectedItems]);

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
            `https://mixes.data.musixspace.com/info`,
            {
              name: response.data.display_name,
              id: response.data.id,
              email: response.data.email || null,
            },
            {
              headers: {
                'Content-Type': 'application/json', // Specify that the request body is JSON
                'Access-Control-Allow-Origin': '*',
              },
            }
          )
          .then(response => {
          })
          .catch(err => {
            toast.error(
              'Whoops! Our DJ got tangled in cables. Please give it another go! 🎧'
            );
          });

        axios
          .post(
            `https://api.spotify.com/v1/users/${response.data.id}/playlists`,
            {
              name: mixTitle,
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
                toast.error(
                  'Whoops! Our DJ got tangled in cables. Please give it another go! 🎧'
                );
              });
          })
          .catch(err => {
            toast.error(
              'Whoops! Our DJ got tangled in cables. Please give it another go! 🎧'
            );
          });
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          localStorage.clear('access_token');
          handleLogin();
        } else {
          toast.error(
            'Whoops! Our DJ got tangled in cables. Please give it another go! 🎧'
          );
        }
      });
  };

  const generateMix = () => {
    setLoadingMix(true);
    setSpotifyPlaylistId(null);
    pauseAudio();
    setCurrentTrack(null);

    if (mode === 'Prompts') {
      setMixTitle(prompt);
      axios
        .post(
          'https://mixes.data.musixspace.com/',
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
          setCurrentTrack(response.data.results[0]);
          setCurrentIndex(null);
          setAudioPlaying(false);
        })
        .catch(err => {
          toast.error(
            'Whoops! Our DJ got tangled in cables. Please give it another go! 🎧'
          );
          setLoadingMix(false);
        });
    } else {
      const title = selectedItems.map(obj => obj.name).join(', ');
      setMixTitle(`music similar to ${title}`);
      axios
        .post(
          'https://mixes.data.musixspace.com/recs',
          {
            title: mixTitle,
            uris: selectedItems.map(item => item.uri),
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
          setCurrentTrack(response.data.results[0]);
          setCurrentIndex(null);
          setAudioPlaying(false);
        })
        .catch(err => {
          toast.error(
            'Whoops! Our DJ got tangled in cables. Please give it another go! 🎧'
          );
          setLoadingMix(false);
        });
    }
  };

  window.addEventListener('ended', event => {
    setAudioPlaying(false);
  });

  const handleBoxClick = () => {
    setIsDropOpen(!isDropOpen);
  };

  const handleOutsideClick = (event) => {
    if (boxRef.current && !boxRef.current.contains(event.target)) {
      setIsDropOpen(!false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const toggleAudio = (track, idx) => {
    setCurrentAlbum(track.img_url);
    setCurrentTrack(track);
    var audio_element = document.getElementsByClassName('current-playing')[0];
    if (currentIndex === idx) {
      setCurrentIndex(idx);
      audio_element.src = track.preview_url;
      audioPlaying ? audio_element.pause() : audio_element.play();
      setAudioPlaying(!audioPlaying);
    } else {
      setCurrentIndex(idx);
      audio_element.src = track.preview_url;
      audio_element.play();
      setAudioPlaying(true);
    }
  };

  const pauseAudio = state => {
    var audio_element = document.getElementsByClassName('current-playing')[0];
    audio_element.pause();
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
      <Helmet>
        <meta charSet="utf-8" />
        <title>Mixes - Music for any moment!</title>
        <link rel="canonical" href="http://mysite.com/example" />
      </Helmet>
      <Box bgGradient="linear(to-r,#16032F, #000000)">
        <Flex
          wrap={['wrap', 'wrap', 'nowrap', 'nowrap', 'nowrap']}
          p={[6, 6, 12]}
          gap={48}
          direction={'row'}
          position={'relative'}
        >
          <Box
            h="95vh"
            maxH="95vh"
            position={'relative'}
            overflow={'scroll'}
            css={customScrollbarStyles}
            gap={24}
            textAlign={'left'}
            w={['100%', '100%', '100%', '60%', '60%']}
          >
            <Flex gap={0} direction={'row'}>
              <Text
                fontSize={['3xl', '3xl', '3xl', '6xl', '6xl']}
                fontWeight={'800'}
                color="#F59C24"
              >
                Mixes
              </Text>
            </Flex>
            <VStack
              textAlign={'left'}
              marginTop={[10, 10, 16]}
              spacing={['54px', '64px']}
            >
              <Text
                fontSize={['2xl', '2xl', '2xl', '5xl', '5xl']}
                fontWeight={'bold'}
                color="#FFFFFF"
              >
                Need new music? Give us a one-liner & we'll curate a mix for you
                💿
              </Text>
              <Stack w={'100%'} spacing={4}>
                <Menu>
                  <MenuButton
                    marginLeft={['6px', '6px', '12px']}
                    alignSelf={'left'}
                    fontSize={['xs', 'xs', 'lg']}
                    borderRadius={'3xl'}
                    backgroundColor={'#D9D9D9'}
                    as={Button}
                    pt={6}
                    pb={6}
                    onClick={e => setIsDropOpen(false)}
                    justifyContent={'space-betweeen'}
                    gap={[16, 16, 24, 24, 24]}
                    w={['auto']}
                    maxW={['40vw', '35vw', '22vw', '12vw']}
                    rightIcon={<FaChevronDown />}
                  >
                    {mode}
                  </MenuButton>
                  <MenuList>
                    <MenuItem
                      fontSize={['sm', 'sm', 'lg']}
                      onClick={e => {
                        setSelectedItems([]);
                        setMode('Prompts');
                      }}
                    >
                      Prompts
                    </MenuItem>
                    <MenuItem
                      fontSize={['sm', 'sm', 'lg']}
                      onClick={e => {
                        setSearch('');
                        setMode('Similar Artists');
                      }}
                    >
                      Similar Artists
                    </MenuItem>
                    <MenuItem
                      fontSize={['sm', 'sm', 'lg']}
                      onClick={e => {
                        setSearch('');
                        setMode('Similar Tracks');
                      }}
                    >
                      Similar Tracks
                    </MenuItem>
                  </MenuList>
                </Menu>
                <InputGroup
                  border={'2px solid #FFFFFF'}
                  alignContent={'center'}
                  borderRadius={48}
                >
                  {/* <Button marginLeft={'12px'} alignSelf={'center'} fontSize={'md'} paddingTop={'15px'} paddingBottom={'15px'} paddingLeft={'22px'} paddingRight={'22px'}   borderRadius={'3xl'} backgroundColor={'#D9D9D9'}> */}
                  {/* </Button> */}
                  {mode === 'Prompts' ? (
                    <Input
                      onChange={e => setPrompt(e.target.value)}
                      value={prompt}
                      focusBorderColor={'transperant'}
                      border={'transparent'}
                      borderRadius={48}
                      w={'100%'}
                      fontWeight={'700'}
                      textColor={'#F59C24'}
                      fontSize={['md', 'md', '2xl', '2xl', '2xl']}
                      p={[6, 6, 8]}
                      placeholder="Enter your moment here"
                    />
                  ) : (
                    <>
                      <Input
                        onChange={e => {
                          setSearch(e.target.value);
                          debouncedSearch(e.target.value);
                        }}
                        value={search}
                        focusBorderColor={'transperant'}
                        border={'transparent'}
                        borderRadius={48}
                        w={'100%'}
                        fontWeight={'700'}
                        textColor={'#F59C24'}
                        fontSize={['md', 'md', '2xl', '2xl', '2xl']}
                        p={[6, 6, 8]}
                        placeholder="Search for your artists/tracks"
                      />
                    </>
                  )}
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
              {search && search.length && isDropOpen > 0 && (
                <>
                  <Box
                    position="absolute"
                    zIndex={9}
                    // mt={["calc(80% + 4px)","calc(90% + 4px)","calc(64% + 4px)","calc(42% + 4px)"]}
                    marginTop={['17.2em', '12em', '16.75rem', '21rem']}
                    width="100%"
                    boxShadow="lg"
                    borderRadius="lg"
                    maxH="230px"
                    overflowY="auto"
                    backgroundColor={'#282828'}
                    ref={boxRef}
                    onClick={(e)=>handleBoxClick()}
                  >
                    {/* <Flex
                  position={'absolute'}
                  direction={'column'}
                  textAlign={'left'}
                  alignContent={'flex-start'}
                  backgroundColor={'#282828'}
                  marginTop={['14em', '12em', '13rem', '17.5em']}
                  w={['90%', '90%', '48%']}
                  h="auto"
                  maxH={'35vh'}
                  overflow={'scroll'}
                  zIndex={9999}
                  borderRadius={12}
                > */}
                    {searchResults.map(item => (
                      <Flex
                        textAlign={'left'}
                        alignItems={'left'}
                        gap={[7, 14]}
                        direction={'row'}
                        cursor="pointer"
                        _hover={{ bg: 'black' }}
                        p={4}
                        onClick={e => {
                          setSearch('');
                          if (selectedItems.length <= 4) {
                            setSelectedItems(selectedItems => [
                              ...selectedItems,
                              item,
                            ]);
                          } else {
                            toast.error(
                              'Umm, our DJ can only take up to 5 tracks/artists as inspiration! 🎧'
                            );
                          }
                        }}
                      >
                        <Image
                          borderRadius={48}
                          float={'left'}
                          h={[12]}
                          w={[12]}
                          src={item.img_url}
                        />
                        <Text
                          fontWeight={'600'}
                          alignSelf={'center'}
                          fontSize={['sm', 'sm', 'lg']}
                          color="#fff"
                        >
                          {item.name}
                        </Text>
                      </Flex>
                    ))}
                    {/* </Flex> */}
                  </Box>
                </>
              )}
            </VStack>
            <Flex
              gap={[2, 4]}
              alignItems={'center'}
              w="auto"
              direction={'row'}
              wrap="wrap"
            >
              {selectedItems.length > 0 &&
                selectedItems.map(item => (
                  <Flex
                    p={[2, 2, 2]}
                    borderRadius={48}
                    border="2px solid white"
                    marginTop={'12px'}
                    align={'center'}
                    fontSize={['xs', 'xs', 'md']}
                    alignContent={'center'}
                    textAlign={'center'}
                    gap={[1, 1, 4]}
                    direction={'row'}
                  >
                    <Image
                      height={[6, 6, 8]}
                      width={[6, 6, 8]}
                      borderRadius={36}
                      src={item.img_url}
                    />
                    <Text fontWeight={'600'} alignSelf={'center'} color="#fff">
                      {item.name}
                    </Text>
                    <AiFillMinusCircle
                      onClick={e =>
                        setSelectedItems(selectedItems =>
                          selectedItems.filter(pitem => pitem.uri !== item.uri)
                        )
                      }
                      size={24}
                      color="#fff"
                    />
                  </Flex>
                ))}
            </Flex>
            <Flex
              flexWrap={'wrap'}
              direction={'row'}
              gap={['12px', '12px', '24px']}
              marginTop={'24px'}
              zIndex={1}
              display={
                playlist &&
                (playlist.length < 1) & !loadingMix &&
                selectedItems.length < 1
                  ? 'flex'
                  : 'none'
              }
            >
              <Text
                border={'2px solid #ffffff'}
                borderRadius={'64px'}
                fontSize={['xs', 'xs', 'xl', 'xl', 'xl']}
                p={['14px', '14px', '18px']}
                cursor={'pointer'}
                fontWeight={'700'}
                color="#AC91C1"
                onClick={e => setPrompt('artists that sound like the weekend')}
              >
                artists that sound like the weekend
              </Text>
              <Text
                border={'2px solid #ffffff'}
                borderRadius={'64px'}
                fontSize={['xs', 'xs', 'xl', 'xl', 'xl']}
                p={['14px', '14px', '18px']}
                fontWeight={'700'}
                cursor={'pointer'}
                color="#AC91C1"
                onClick={e => setPrompt('punjabi party vibes')}
              >
                punjabi party vibes
              </Text>
              <Text
                border={'2px solid #ffffff'}
                borderRadius={'64px'}
                fontSize={['xs', 'xs', 'xl', 'xl', 'xl']}
                p={['14px', '14px', '18px']}
                fontWeight={'700'}
                cursor={'pointer'}
                color="#AC91C1"
                onClick={e => setPrompt('head banging rock like nirvana')}
              >
                head banging rock like nirvana
              </Text>
              <Text
                border={'2px solid #ffffff'}
                borderRadius={'64px'}
                fontSize={['xs', 'xs', 'xl', 'xl', 'xl']}
                p={['14px', '14px', '18px']}
                fontWeight={'700'}
                cursor={'pointer'}
                color="#AC91C1"
                onClick={e =>
                  setPrompt('indie songs to listen to on a roadtrip')
                }
              >
                indie songs to listen to on a roadtrip
              </Text>
            </Flex>
            <Flex marginTop={'4px'} marginBottom={'4px'}>
              <Text
                marginTop={'48px'}
                marginBottom={'24px'}
                fontSize={['xl', 'xl', '2xl', '2xl', '2xl']}
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
                      <Text fontSize={['md', 'md', 'lg', 'lg', 'lg']}>
                        Open in Spotify
                      </Text>
                      <FaSpotify color={'#1DB954'} size={22} />
                    </Flex>
                  </Button>
                ) : (
                  <Button
                    marginTop={[2]}
                    isDisabled={loadingMix ? true : false}
                    onClick={
                      localStorage.getItem('access_token')
                        ? () => {
                            setAddingPlaylist(true);
                            generatePlaylist(
                              localStorage.getItem('access_token')
                            );
                          }
                        : onOpen
                    }
                    borderRadius={'24px'}
                  >
                    <Flex textAlign={'center'} gap={2}>
                      {addingPlaylist ? (
                        <Spinner />
                      ) : (
                        <>
                          <Text fontSize={['md', 'md', 'lg', 'lg', 'lg']}>
                            Add to Spotify
                          </Text>
                          <FaSpotify color={'#1DB954'} size={22} />
                        </>
                      )}
                    </Flex>
                  </Button>
                )}
                <Modal size={'md'} isOpen={isOpen} onClose={onClose}>
                  <ModalOverlay backdropFilter="blur(10px)" />
                  <ModalContent
                    width={['100%', '100%', '50%']}
                    h={['40%', '40%', '30%']}
                    bgGradient="linear(to-r,#16032F, #000000)"
                  >
                    <ModalCloseButton
                      onClick={e => setAddingPlaylist(false)}
                      size={'lg'}
                      color={'#F59C24'}
                    />
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
                        <Image
                          filter={loadingMix ? 'blur(8px)' : null}
                          src={currentTrack && currentTrack.img_url}
                        />
                        <Text
                          color={'#F59C24'}
                          w="100%"
                          fontSize={['lg', 'lg', '2xl']}
                          fontWeight={'700'}
                        >
                          Connect your Spotify
                        </Text>
                        <Text
                          color={'#ffffff'}
                          w="100%"
                          fontSize={['md', 'md', 'xl']}
                          fontWeight={'500'}
                        >
                          Connect your Spotify account to add this mix to your
                          library!
                        </Text>
                        <Button
                          className="connect-spotify"
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
                              <Text fontSize={['md', 'md', 'xl']}>
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
            <Flex gap={4} direction={'column'}>
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
                  <Spinner
                    thickness="4px"
                    size={['lg', 'lg', 'xl', 'xl', 'xl']}
                    color="#F59C24"
                  />
                  <Text
                    fontWeight={'600'}
                    color={'#fff'}
                    fontSize={['lg', 'lg', '2xl', '2xl', '2xl']}
                  >
                    Generating your mix..
                  </Text>
                </Flex>
              ) : (
                playlist &&
                playlist.map((track, idx) => (
                  <HStack
                    p={4}
                    gap={6}
                    align={'left'}
                    borderRadius={6}
                    backgroundColor={idx === currentIndex ? 'black' : 'none'}
                  >
                    <Image
                      borderRadius={4}
                      height={'64px'}
                      width={'64px'}
                      cursor={'pointer'}
                      src={track.img_url}
                      onClick={e => window.open(track.href)}
                    />
                    <Flex direction={'column'} align={'left'}>
                      <Text
                        fontSize={['16px', '16px', '18px']}
                        fontWeight={'700'}
                        color="#AC91C1"
                        cursor={'pointer'}
                        _hover={{ textDecoration: 'underline' }}
                        onClick={e => window.open(track.href)}
                      >
                        {' '}
                        {track.name}
                      </Text>
                      <Text
                        fontSize={['12px', '12px', '14px']}
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
          <Box
            display={['none', 'none', 'flex']}
            alignContent={'center'}
            overflow="hidden"
            textAlign={'center'}
            w={['0%', '0%', '30%', '40%', '40%']}
          >
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
                height="auto"
                maxH={'70vh'}
                width="auto"
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
