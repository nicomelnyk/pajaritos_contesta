// Videos Alimentación Granívoro option configuration
var REPLY_OPTION_VIDEOS_ALIMENTACION_GRANIVORO = {
  name: 'Videos Alimentación Granívoro',
  replies: [
    {
      id: 'videos_granivoro_1',
      text: 'https://youtu.be/wUN2wjMBTtw',
      image: null
    },
    {
      id: 'videos_granivoro_2',
      text: 'https://youtu.be/XbH6uwT8GWI',
      image: null
    },
    {
      id: 'videos_granivoro_3',
      text: 'https://youtu.be/3YY0otOrEIs',
      image: null
    }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
    REPLY_OPTIONS_REGISTER('videos_alimentacion_granivoro', REPLY_OPTION_VIDEOS_ALIMENTACION_GRANIVORO);
  }
})();
