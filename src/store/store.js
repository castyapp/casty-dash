import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import config from './api'

Vue.use(Vuex)

let baseURL = `${config.schema}://${config.baseURL}/${config.version}`;
axios.defaults.baseURL = baseURL;

export const store = new Vuex.Store({
  state: {
    refreshed_token: localStorage.getItem('refreshed_token') || null,
    token: localStorage.getItem('access_token') || null,
    user: null,
  },
  getters: {
    loggedIn: (_, getters) => {
      return getters.token !== null
    },
    token: state => {
      if (state.token === "null" || state.token === null || state.token === ""){
        return null
      }
      return state.token
    },
    user: state => state.user,
  },
  mutations: {
    retrieveToken: (state, {token, refreshed_token}) => {
      state.token = token;
      localStorage.setItem('access_token', state.token);
      state.refreshed_token = refreshed_token;
      localStorage.setItem('refreshed_token', refreshed_token);
    },
    destroyToken: (state) => {
      state.token = null;
      state.user = {};
      localStorage.removeItem("access_token");
      localStorage.removeItem("refreshed_token");
    },
    addUserData: (state, data) => {
      state.user = data;
      localStorage.setItem('user', JSON.stringify(data));
    }
  },
  actions: {
    logout(context) {
      context.commit("destroyToken");
      this.state.user = null;
    },
    getFriendsList(context) {
      return new Promise((resolve, reject) => {
        axios.get('/user/@friends', {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          },
        }).then(response => {
          resolve(response.data.result)
        }).catch(reject)
      })
    },
    getPendingFriendRequestsList(context) {
      return new Promise((resolve, reject) => {
        axios.get('/user/@friends/pending', {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          },
        }).then(response => {
          resolve(response.data.result)
        }).catch(reject)
      })
    },
    getUser(context) {
      return new Promise((resolve, reject) => {
        axios.get('/user/@me', {
          headers: {
            authorization: `Bearer ${context.state.token}`
          },
        }).then(response => {
          resolve(response.data.result);
        }).catch(reject)
      })
    },
    parseMediaSourceUri(context, uri) {
      return new Promise((resolve, reject) => {

        const params = new URLSearchParams();
        params.append('source', uri);

        axios.post('/user/@media/parse', params, {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          },
        }).then(resolve).catch(reject)
      })
    },
    selectNewMediaSource(context, media_source_id) {
      return new Promise((resolve, reject) => {

        const params = new URLSearchParams();
        params.append('source_id', media_source_id);

        axios.post('/user/@media/select', params, {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          },
        }).then(resolve).catch(reject)

      })
    },
    removeMediaSource(context, media_source_id) {
      return new Promise((resolve, reject) => {
        axios.delete('/user/@media', {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          },
          params: {
            source_id: media_source_id
          },
        }).then(resolve).catch(reject)
      })
    },
    saveNewMediaSource(context, {title, uri, accessToken}) {
      return new Promise((resolve, reject) => {

        const params = new URLSearchParams();
        params.append('title', title);
        params.append('source', uri);

        let headers = {
          authorization: `Bearer ${context.state.token}`,
        }

        if (accessToken !== undefined && accessToken !== null) {
          headers['Service-Authorization'] = accessToken
        }

        axios.post('/user/@media', params, {headers})
          .then(resolve)
          .catch(reject)

      })
    },
    loadMediaSources(context) {
      return new Promise((resolve, reject) => {
        axios.get('/user/@media', {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          },
        }).then(resolve).catch(reject)
      })
    },
    searchUser(context, keyword) {
      return new Promise((resolve, reject) => {
        axios.get(`/user/@search?keyword=${keyword}`, {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          },
        }).then(response => {
          resolve(response.data.result);
        }).catch(reject);
      })
    },
    getFriend(context, friend_id) {
      return new Promise((resolve, reject) => {
        axios.get(`/user/@friend/${friend_id}`, {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          },
        }).then(response => {
          resolve(response.data.result);
        }).catch(reject);
      })
    },
    getMessages(context, receiverId) {
      return new Promise((resolve, reject) => {
        axios.get(`/user/@messages/${receiverId}`, {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          },
        }).then(response => {
          resolve(response.data.result);
        }).catch(reject);
      })
    },
    getTheater(context, user) {
      return new Promise((resolve, reject) => {

        let reqUri = '/user/@theater'
        if (user !== undefined){
          reqUri = `/user/@theater/${user}`
        }

        let headers = {};
        if (this.getters.loggedIn){
          headers = {
            authorization: `Bearer ${context.state.token}`
          };
        }

        axios.get(reqUri, {headers}).then(response => {
          resolve(response.data.result);
        }).catch(reject);
      })
    },
    getSubtitles(context, media_source_id) {
      return new Promise((resolve, reject) => {

        let reqUri = `/user/@theater/${media_source_id}/subtitles`
        let headers = {};
        if (this.getters.loggedIn){
          reqUri = `/user/@theaters/${media_source_id}/subtitles`
          headers = {
            authorization: `Bearer ${context.state.token}`
          };
        }

        axios.get(reqUri, {headers}).then(response => {
          resolve(response.data.result)
        }).catch(reject);
      })
    },
    uploadSubtitle(context, {subtitle, media_source_id}) {
      return new Promise((resolve, reject) => {
        let params = new FormData();
        params.append('lang', subtitle.lang);
        params.append('subtitle', subtitle.file, subtitle.file.name);
        axios.post(`/user/@theaters/${media_source_id}/subtitles`, params, {
          headers: {
            'Content-Type': 'multipart/form-data',
            authorization: `Bearer ${context.state.token}`,
          }
        }).then(resolve).catch(reject);
      })
    },
    followedTheaters(context) {
      return new Promise((resolve, reject) => {
        axios.get(`/user/@theaters`, {
          headers: {
            authorization: `Bearer ${context.state.token}`
          }
        }).then(resolve).catch(reject);
      })
    },
    followTheater(context, theater_id) {
      return new Promise((resolve, reject) => {
        axios.get(`/user/@theaters/${theater_id}/follow`, {
          headers: {
            authorization: `Bearer ${context.state.token}`
          }
        }).then(resolve).catch(reject);
      })
    },
    unfollowTheater(context, theater_id) {
      return new Promise((resolve, reject) => {
        axios.get(`/user/@theaters/${theater_id}/unfollow`, {
          headers: {
            authorization: `Bearer ${context.state.token}`
          }
        }).then(resolve).catch(reject);
      })
    },
    updateProfile(context, form) {

      return new Promise((resolve, reject) => {

        let params = new FormData();
        params.append('fullname', form.fullname);

        let headers = {
          'Content-Type': 'multipart/form-data',
          authorization: `Bearer ${context.state.token}`,
        }

        if (form.avatar !== null) {
          params.append('avatar', form.avatar, form.avatar.name);
        }

        axios.put(`/user/@me`, params, {
          headers: {
            'Content-Type': 'multipart/form-data',
            authorization: `Bearer ${context.state.token}`,
          }
        }).then(response => {
          resolve(response.data.result)
        }).catch(reject);
      })

    },
    updatePassword(context, form) {

      return new Promise((resolve, reject) => {

        let params = new FormData();
        params.append('current_password', form.current_password);
        params.append('new_password', form.new_password);
        params.append('verify_new_password', form.verify_new_password);

        axios.put(`/user/@password`, params, {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          }
        }).then(resolve).catch(reject);
      })

    },
    updateTheater(context, data) {

      return new Promise((resolve, reject) => {

        let params = new FormData();
        if (data.changes.description) {
          params.append('description', data.form.description);
        }
        if (data.changes.privacy) {
          params.append('privacy', data.form.privacy);
        }
        if (data.changes.video_player_access) {
          params.append('video_player_access', data.form.video_player_access);
        }

        axios.put(`/user/@theater`, params, {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          }
        }).then(resolve).catch(reject);
      })

    },
    sendFriendRequest(context, friend_id) {
      return new Promise((resolve, reject) => {
        axios.get(`/user/@friend/${friend_id}/request`, {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          }
        }).then(resolve).catch(reject);
      })
    },
    acceptFriendRequest(context, request_id) {
      return new Promise((resolve, reject) => {
        const params = new FormData();
        params.append('request_id', request_id)
        axios.post(`/user/@friend/accept`, params, {
          headers: {
            authorization: `Bearer ${context.state.token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }).then(resolve).catch(reject);
      })
    },
    register(context, data) {
      return new Promise((resolve, reject) => {

        let params = new FormData();
        params.append('email', data.email);
        params.append('fullname', data.fullname);
        params.append('username', data.username);
        params.append('password', data.password);
        params.append('password_confirmation', data.password_confirmation);

        const headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
        }

        if (typeof data.recaptchaToken !== 'undefined') {
          headers['h-captcha-response'] = data.recaptchaToken
        }

        axios.post(`/user/@create`, params, {headers}).then(response => {
          const {token, refreshed_token} = response.data.result;
          context.commit('retrieveToken', {token, refreshed_token});
          resolve(response);
        }).catch(reject);
      })
    },
    refreshToken(context) {
      return new Promise((resolve, reject) => {
        axios.put(`/@auth/@create`, {}, {
          headers: {
            authorization: `Bearer ${context.state.refreshed_token}`,
          }
        }).then(resolve).catch(reject);
      })
    },
    login(context, credentials) {

      return new Promise((resolve, reject) => {

        const params = new URLSearchParams();

        params.append('user', credentials.user);
        params.append('pass', credentials.pass);

        const headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
        }

        if (typeof credentials.recaptchaToken !== 'undefined') {
          headers['h-captcha-response'] = credentials.recaptchaToken
        }

        axios.post('/auth/@create', params, {headers}).then(response => {
          const {token, refreshed_token} = response.data.result;
          context.commit('retrieveToken', {token, refreshed_token});
          resolve(response);
        }).catch(reject);

      })

    },
    getNotifications(context) {
      return new Promise((resolve, reject) => {
        axios.get(`/user/@notifications`, {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          }
        }).then(resolve).catch(reject);
      })
    },
    readAllNotifications(context) {
      return new Promise((resolve, reject) => {
        axios.put(`/user/@notifications`, {}, {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          }
        }).then(resolve).catch(reject);
      })
    },
    userConnections(context) {
      return new Promise((resolve, reject) => {
        axios.get(`/user/@connections`, {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          }
        }).then(resolve).catch(reject);
      })
    },
    userConnection(context, service) {
      return new Promise((resolve, reject) => {
        axios.get(`/user/@connections/${service}`, {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          }
        }).then(resolve).catch(reject);
      })
    },
    OAUTHCallback(context, {service, code, ref}) {
      return new Promise((resolve, reject) => {

        const params = new URLSearchParams();
        params.append('code', code);

        let headers = {};
        if (this.getters.loggedIn){
          headers = {
            authorization: `Bearer ${context.state.token}`
          };
        }

        axios.post(`/oauth/${service}/@callback`, params, {headers}).then(response => {
          if (ref !== 'dashboard') {
            const {token, refreshed_token} = response.data.result;
            context.commit('retrieveToken', {token, refreshed_token});
          }
          resolve(response);
        }).catch(reject);

      })
    },
    refreshConnectionToken(context, service) {
      return new Promise((resolve, reject) => {
        axios.put(`/user/@connections/${service}`, {}, {
          headers: {
            authorization: `Bearer ${context.state.token}`,
          }
        }).then(resolve).catch(reject);
      })
    },
    getSpotifyTrack(context, {id, service, access_token}) {
      return new Promise((resolve, reject) => {
        axios.get(`https://api.spotify.com/v1/${service}/${id}?ts=${new Date().getTime()}`, {
          headers: {
            authorization: `Bearer ${access_token}`,
          }
        }).then(response => {
          resolve({ response, access_token })
        }).catch(err => {
          const { config, response: { status } } = err;
          const originalRequest = config;
          if (status === 401) {
            context.dispatch('refreshConnectionToken', 'spotify').then(async response => {
              access_token = response.data.result[0].access_token;
              originalRequest.headers["authorization"] = `Bearer ${access_token}`;
              let resp = await axios(originalRequest)
              resolve({ response: resp, access_token})
            }).catch(reject)
          } else {
            reject(err)
          }
        });
      })
    },
    spotifyPlayRequest(context, {access_token, device_id}) {
      return new Promise((resolve, reject) => {
        const params = {data: {device_ids: [device_id], play: true}};
        axios.put(`https://api.spotify.com/v1/me/player?ts=${new Date().getTime()}`, params, {
          headers: {
            authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          }
        }).then(response => {
          resolve({ response, access_token })
        }).catch(err => {
          const { config, response: { status } } = err;
          const originalRequest = config;
          if (status === 401) {
            context.dispatch('refreshConnectionToken', 'spotify').then(async response => {
              access_token = response.data.result[0].access_token;
              originalRequest.headers["authorization"] = `Bearer ${access_token}`;
              let resp = await axios(originalRequest)
              resolve({ response: resp, access_token})
            }).catch(reject)
          } else {
            reject(err)
          }
        });
      })
    },
    playOnSpotify(context, {access_token, device_id, spotify_uris}) {
      return new Promise((resolve, reject) => {
        const params = {uris: spotify_uris};
        axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, params, {
          headers: {
            authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          }
        }).then(response => {
          resolve({ response, access_token })
        }).catch(err => {
          const { config, response: { status } } = err;
          const originalRequest = config;
          if (status === 401) {
            context.dispatch('refreshConnectionToken', 'spotify').then(async response => {
              access_token = response.data.result[0].access_token;
              originalRequest.headers["authorization"] = `Bearer ${access_token}`;
              let resp = await axios(originalRequest)
              resolve({ response: resp, access_token})
            }).catch(reject)
          } else {
            reject(err)
          }
        });
      })
    }
  },
});
