// implicit grant flow

const clientId = '9447cee4c50745b2baad44fedaaca73e';
const redirectUri = 'http://localhost:3000/';


let accessToken;

const Spotify = {
  getAccessToke(){
    if(accessToken){
      return accessToken;
    }

    // check for access token match
    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

    if (accessTokenMatch && expiresInMatch) {
      accessToken = accessTokenMatch[1];
      const expiresIn = Number(expiresInMatch[1]);
      // this clears the parameters, allowing us to grab a new access token when it expires
      window.setTimeout(() => accessToken = '', expiresIn * 1000);
      window.history.pushState('Access Token', null, '/')
      return accessToken;
    } else {
      const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
      window.location = accessUrl
    }
  },

  search(term){
    // this give us access to our token during our search
    const accessToken = Spotify.getAccessToke();
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`,
    { headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).then(response => {
      return response.json()
    }).then(jsonResponse => {
      if (!jsonResponse.tracks){
        return [];
      }
      return jsonResponse.tracks.items.map(track =>({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        uri: track.uri
      }))
    })

  },

  savePlaylist(name, trackUris){
    if(!name || !trackUris.length){
      return;
    }

    const accessToken = Spotify.getAccessToke();
    const headers = { Authorization: `Bear ${accessToken}`};
    let userId;

    return fetch('https://api.spotify.com/v1/me', { headers: headers}
    ).then(response => response.json()
    ).then(jsonResponse => {
      userId = jsonResponse.id;
      return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        headers: headers,
        method: 'POST',
        body: JSON.stringify({ name: name })
      }).then(response => response.json()
    ).then(jsonResponse => {
      const playlistId = jsonResponse.id;
      return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
        headers: headers,
        method: 'POST',
        body: JSON.stringify({ uris: trackUris })
      })
    })
    })
  }
};

export default Spotify;
