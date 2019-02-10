Module.register('MMM-Sonos-Control', {
  defaults: {
    sonosRoomName: 'Living Room',
    updateInterval: 10000, // every 5 seconds
    apiBase: 'http://localhost',
    apiPort: 5005,
    zonesEndpoint: 'zones',
    playlistEndpoint: "playlist"
  },

  current_song: {
    title: '',
    album: '',
    artist: '',
    albumArtUrl: '',
    duration: '',
    is_playing: false
  },

  start: function() {
    Log.info('Starting module: ' + this.name);
    this.update();

    // refresh every x milliseconds
    setInterval(
      this.update.bind(this),
      this.config.updateInterval
    );
  },

  update: function() {
    this.sendSocketNotification(
      'SONOS_UPDATE',
      this.config.apiBase + ":" + this.config.apiPort + "/" + this.config.zonesEndpoint
    );
  },

  getCurrentPlaylist: function() {
    this.sendSocketNotification(
      'SONOS_UPDATE',
      this.config.apiBase + ":" + this.config.apiPort + "/" + this.config.playlistEndpoint
    );
  },

  updateSonosInfo: function(data) {
    var sonos = this.getRoomInfo(data, this.config.sonosRoomName);

    var state = sonos.coordinator.state
    var current_track = state.currentTrack;

    this.current_song.title = current_track.title;
    this.current_song.album = current_track.album;
    this.current_song.artist = current_track.artist;
    this.current_song.albumArtUrl = current_track.absoluteAlbumArtUri;
    this.current_song.duration = (state.elapsedTime / current_track.duration) * 100;
    this.current_song.is_playing = sonos.coordinator.state.playbackState == 'PLAYING';

    if (this.current_song.duration > 100) {
      this.current_song.duration = 100;
    }
  },

  getRoomInfo: function(data, roomName) {
    return data.filter(function(room) {
      var membersArray = room.members.map(function(member) {
        return member.roomName;
      });

      return membersArray.includes(roomName);
    })[0];
  },

  render: function(data) {
    this.updateSonosInfo(data);
    this.updateDom();
  },

  getMusicPlayer: function() {
    var animated_class = (this.config.animatedVinyl&&this.current_song.is_playing) ? 'spin' : '';
    return '<div class="player">\
      <div class="album-cover">\
        <img src="' + this.current_song.albumArtUrl + '" />\
		<div class="vinyl ' + animated_class + '" style="background-image: url(\'https://s3-us-west-2.amazonaws.com/s.cdpn.io/83141/vinyl.png\'), url(\'' + this.current_song.albumArtUrl + '\');"></div>\
      </div>\
      <div class="song-progress-bar">\
        <div class="inner-bar" style="width: ' + this.current_song.duration + '%"></div>\
      </div>\
      <div class="song-info">\
        <div class="module-content">\
          <div>\
            <div class="bright medium light">' + this.current_song.title + '</div>\
            <div class="light small dimmed">' + this.current_song.artist + ' - ' + this.current_song.album + '</div>\
          </div>\
        </div>\
      </div>\
    </div>';
  },

  getScripts: function() {
    return [
      '//cdnjs.cloudflare.com/ajax/libs/jquery/2.2.2/jquery.js'
    ];
  },

  getStyles: function() {
    return [
      'style.css',
      'player.css'
    ];
  },

  getHeader: function() {
    return this.config.sonosRoomName + ' Sonos';
  },

  getDom: function() {
    return $(this.getMusicPlayer())[0];
  },

  socketNotificationReceived: function(notification, payload) {
    switch (notification) {
      case 'SONOS_DATA':
        this.render(payload);
        break;
    }
  }
});
