// 3/15/2025 - 11:53 PM CST
// copied and modified from https://27or27.github.io/tm/thickness_meter.htm


var SETTINGS_VERSION = 1;
var BUFFER_SIZE = 256;
var SAMPLE_RATE = 44100;
var MAX_THICKNESS_BUFFER_SIZE = Math.round(30*60*SAMPLE_RATE/BUFFER_SIZE); // 30 minutes worth of results

//var color_str_to_rgb = function (str)
//{
//    var ctx = document.createElement("canvas").getContext("2d");
//    ctx.fillStyle = str;
//    return [parseInt(ctx.fillStyle.slice(1,3), 16),
//            parseInt(ctx.fillStyle.slice(3,5), 16),
//            parseInt(ctx.fillStyle.slice(5), 16)];
//};

//var tts_say = function(msg)
//{
//  var u = new SpeechSynthesisUtterance(msg);
//  u.onend = function(){ window.tts_speaking = false; }
//  u.onerror = u.onend;
//  window.tts_speaking = true;
//  speechSynthesis.speak(u);
//}

//var tts_say_buffer_out_loud_if_speech_present = function(buffer, clear_buffer)
//{
//  if (window.recorder || window.running_state == 'RECORDING')
//  {
//    return;
//  }
//
//  var thin_count = 0, thick_count = 0, unvoiced_count = 0;
//  for (var i=thickness_buffer.length-1; i>0; --i)
//  {
//    if (thickness_buffer[i] >= SecondColorChangeThreshold)
//    {
//      ++unvoiced_count;
//    }
//    else if (thickness_buffer[i] >= FirstColorChangeThreshold)
//    {
//      ++thick_count;
//    }
//    else
//    {
//      ++thin_count;
//    }
//  }
//
//  if ((thick_count+unvoiced_count) > 0)
//  {
//    var total = thickness_buffer.length;
//    tts_say((Math.round(((100*thin_count/total) + Number.EPSILON) * 100) / 100) + '% thin, ' +
//        (Math.round(((100*thick_count/total) + Number.EPSILON) * 100) / 100) + '% thick, ' +
//        (Math.round(((100*unvoiced_count/total) + Number.EPSILON) * 100) / 100) + '% unvoiced');
//    if (clear_buffer)
//    {
//      window.thickness_buffer = [];
//    }
//  }
//}

//var on_thickness_calculated_for_buffer = function(thickness)
//{
//  if (!window.tts_speaking)
//  {
//    window.thickness_buffer.push(thickness);
//  }
//
//  var thickness_buffer = window.thickness_buffer;
//  if (thickness_buffer.length > MAX_THICKNESS_BUFFER_SIZE)
//  {
//    thickness_buffer.splice(0, thickness_buffer.length-MAX_THICKNESS_BUFFER_SIZE);
//  }
//
//  if (SayResultsOutLoud && (thickness == 0))
//  {
//    if (thickness_buffer.slice(-Math.round(SecondsToWaitBeforeSayingResults*SAMPLE_RATE/BUFFER_SIZE)).every((i) => i==0))
//    {
//      tts_say_buffer_out_loud_if_speech_present(thickness_buffer, true);
//    }
//  }
//}

// might use idk
var compatible_getUserMedia = function(opt, done, error)
{
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia){ return navigator.mediaDevices.getUserMedia(opt).then(done).catch(error); }
  if (navigator.getUserMedia){ return navigator.getUserMedia(opt, done, error); }
  if (navigator.webkitGetUserMedia){ return navigator.webkitGetUserMedia(opt, done, error); }
  if (navigator.mozGetUserMedia){ return navigator.mozGetUserMedia(opt, done, error); }
  alert("This app can't access your microphone due to your browser not supporting getUserMedia. If possible, update your browser or try a different browser.");
}

// might use idk
var get_microphone_stream = function(callback)
{
  compatible_getUserMedia({video:false,audio:true}, callback, function(err)
  {
    alert("Couldn't access the microphone. Please make sure you select 'Allow' when asked if the page can access your microphone.\n\n" + err.name + ': ' + err.message)
  });
}

// this
var analyze_and_graph = function(ctx, source)
{
  window.audio_ctx = ctx;
  window.source = source;
  var analyzer = Meyda.createMeydaAnalyzer({
    audioContext: ctx,
    source: source,
    sampleRate: SAMPLE_RATE,
    bufferSize: BUFFER_SIZE,
    featureExtractors: ['mfcc'],
    callback: function(features)
    {
      // The current method for calculating thickness, the "peak counter" algorithm
      // The frequencies of thick voices have a flat slope and the frequencies of thin voices have a steep slope
      // Peaks, in this case, refers to frequencies with intensities greater than their neighbors
      // Peak counter works by counting peaks that are above a user-specified threshold (IntensityThreshold)
      // The thickness is returned as a percent [0,100] of the count over the total possible peaks
      // As the slope of the frequencies decreases, more frequencies fall below the threshold causing the returned thickness to also drop
      // This approach gives the most accurate approximation of the vocal frequency slope over other methods (that I've thought of)
      // Real world audio data is messy, which makes isolating frequency peaks for vocals difficult
      // Subharmonics, turbulence, background noise and other sounds can create their own series of peaks with their own slopes
      // This makes more traditional forms of calculating slopes (e.g. linear regression) ineffective at calculating vocal thickness
      var peaks = 0;
      var mels = features.mfcc;
      var max_range = (RangeLimit/100)*(mels.length-1);
      for (var i=1; i<max_range; ++i)
      {
        if ((mels[i] < IntensityThreshold) && (mels[i] < mels[i-1]) && (mels[i] < mels[i+1]))
        {
          ++peaks;
        }
      }
      var thickness = Math.min(100, (100*peaks)/(RangeLimit*NumBins/300));
      on_thickness_calculated_for_buffer(thickness);

      // Second prototype; included for reference
      /*var count = 0;
      for (mel of features.mfcc)
      {
        if (mel < IntensityThreshold)
        {
          ++count;
        }
      }
      window.gauge.style.width = (100*count/NumBins)+'%';
      window.gauge.style.background = count < (ColorChangeThreshold*NumBins/100) ? ThinColor : ThickColor;*/

      // First prototype; included for reference
      /*var spectrum = features.amplitudeSpectrum;
      var width = 0;
      var avg = 0;
      for (amp of spectrum)
      {
        avg += amp;
      }
      avg /= spectrum.length;

      var threshold = 5*avg;
      var count = 0;
      for (amp of spectrum)
      {
        if (amp > threshold)
        {
          ++count;
        }
      }
      width = 100*count/spectrum.length;

      window.gauge.style.width = width+'%';
      if (width >= WTHRESH)
      {
        window.gauge.style.background = 'red';
      }
      else
      {
        window.gauge.style.background = 'green';
      }*/
    },
  });
  analyzer.start();
  return analyzer;
}

var start = function(callback)
{
  window.thickness_buffer = [];

  get_microphone_stream(function(stream)
  {
    document.querySelector('.settings_panel').style.display = 'none';
    document.querySelector('.graph_container').style.display = 'inline';
    document.querySelector('.pause_button').value = 'Pause';
    document.querySelector('.record_button').value = 'Record';

    window.running_state = 'LIVE';
    initialize_graph();

    IntensityThreshold = document.querySelector('.intenisty_threshold_box').value;
    FirstColorChangeThreshold = document.querySelector('.first_color_change_threshold_box').value;
    SecondColorChangeThreshold = document.querySelector('.second_color_change_threshold_box').value;
    NumBins = document.querySelector('.num_bins_box').value;
    RangeLimit = document.querySelector('.range_limit_box').value;
    ThinColor = document.querySelector('.thin_color_box').value;
    ThickColor = document.querySelector('.thick_color_box').value;
    VeryThickColor = document.querySelector('.very_thick_color_box').value;
    SayResultsOutLoud = document.querySelector('.say_out_loud_box').checked;
    SecondsToWaitBeforeSayingResults = document.querySelector('.seconds_to_wait_box').value;
    document.cookie = 'TMSet='+ [SETTINGS_VERSION, IntensityThreshold, FirstColorChangeThreshold, SecondColorChangeThreshold, NumBins, RangeLimit,
                                 ThinColor, ThickColor, VeryThickColor, SayResultsOutLoud|0, SecondsToWaitBeforeSayingResults].join(',');

    document.querySelector('.thin_box').style.background = ThinColor;
    document.querySelector('.thick_box').style.background = ThickColor;
    document.querySelector('.very_thick_box').style.background = VeryThickColor;

    var ctx = new AudioContext();
    var mic = ctx.createMediaStreamSource(stream);
    window.stream = stream;
    Meyda.numberOfMFCCCoefficients = NumBins;
    window.analyzer = analyze_and_graph(ctx, mic);

    if (callback)
    {
      callback();
    }
  });
}

var initialize_graph = function()
{
  var graph = document.querySelector('.graph');
  window.graph = graph;
  var ctx = window.graph.getContext('2d');
  window.graph_ctx = ctx;

  window.onresize();

  window.requestAnimationFrame(redraw_graph);
}

var redraw_graph = function()
{
  var graph = window.graph;
  var thickness_buffer = window.thickness_buffer;
  if (!SayResultsOutLoud)
  {
    while(thickness_buffer.length > graph.width)
    {
      thickness_buffer.shift();
    }
  }

  var ctx = window.graph_ctx;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, graph.width, graph.height);

  var last_color = null;
  var x_offset = SayResultsOutLoud ? Math.max(thickness_buffer.length-graph.width,0) : 0;
  for (var i=x_offset; i<thickness_buffer.length; ++i)
  {
    var thickness = thickness_buffer[i];
    var color = thickness < SecondColorChangeThreshold ? (thickness < FirstColorChangeThreshold ? ThinColor : ThickColor) : VeryThickColor;
    var y = graph.height-1-(graph.height*thickness/100);

    if (color != last_color)
    {
      if (last_color)
      {
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.moveTo(i-x_offset, y);
    }
    else
    {
      ctx.lineTo(i-x_offset, y);
    }

    last_color = color;
  }

  if (last_color)
  {
    ctx.stroke();
  }

  if (window.running_state)
  {
    window.requestAnimationFrame(redraw_graph);
  }
}

var pause = function()
{
  if (window.stream)
  {
    window.stream.getTracks().forEach(function(track)
    {
      track.stop();
    });
  }

  if (window.analyzer)
  {
    window.analyzer.stop();

    // HACK HACK HACK
    // monkey patch Meyda so it doesn't leak
    // browsers leak this handler for some reason even when there are no refs to spn
    window.analyzer._m.spn.onaudioprocess = null;
  }

  window.analyzer = null;
  window.audio_ctx = null;
  window.source = null;
  window.running_state = false;

  if (SayResultsOutLoud)
  {
    tts_say_buffer_out_loud_if_speech_present(window.thickness_buffer, false);
  }
}

var stop = function()
{
  document.querySelector('.settings_panel').style.display = 'inline';
  document.querySelector('.graph_container').style.display = 'none';
  pause();
  stop_recording();

  var player = document.querySelector('audio');
  if (!player.paused)
  {
    player.pause();
  }
}

var on_start_pause_button = function(evt)
{
  var button = evt.target;
  if (button.value == 'Pause')
  {
    pause();
    button.value = 'Resume';
  }
  else
  {
    start();
  }
}

var do_record = function()
{
  var player = document.querySelector('audio');
  var pause_button = document.querySelector('.pause_button');
  var recorder = new MediaRecorder(window.stream);
  recorder.ondataavailable = function(event)
  {
    var url = URL.createObjectURL(event.data);
    document.querySelector('audio').src = url;
    pause_button.disabled = false;
    player.style.display = 'inline';
    window.recorder = null;
  };
  pause_button.disabled = true;
  player.style.display = 'none';
  recorder.start();
  window.recorder = recorder;
  document.querySelector('.record_button').value = 'Stop Recording';
}

var record = function()
{
  if (!window.running_state)
  {
    start(function()
    {
      do_record();
    });
  }
  else
  {
    do_record();
  }
}

var stop_recording = function()
{
  document.querySelector('.record_button').value = 'Record';
  if (window.recorder)
  {
    window.recorder.stop();
  }
}

var on_toggle_record = function(evt)
{
  var button = evt.target;
  if (button.value == 'Record')
  {
    record();
  }
  else
  {
    stop_recording();
  }
}

var on_recording_playing = function(evt)
{
  if (window.running_state != 'RECORDING')
  {
    pause();
    document.querySelector('.pause_button').disabled = true;
    document.querySelector('.record_button').disabled = true;

    if (!window.recording_ctx)
    {
      window.recording_ctx = new AudioContext();
      window.recording_source = window.recording_ctx.createMediaElementSource(evt.target);
      window.recording_source.connect(window.recording_ctx.destination);
    }

    window.thickness_buffer = [];
    window.running_state = 'RECORDING';
    window.analyzer = analyze_and_graph(window.recording_ctx, window.recording_source);
    window.requestAnimationFrame(redraw_graph);
  }
}

var on_recording_paused = function()
{
  pause();
  var pause_button = document.querySelector('.pause_button');
  pause_button.value = 'Resume';
  pause_button.disabled = false;
  document.querySelector('.record_button').disabled = false;
}

window.onresize = function()
{
  if (window.graph)
  {
    var graph_width = Math.round(4*window.innerWidth/5);
    var graph_height = Math.round(4*window.innerHeight/5);

    graph.width = graph_width;
    graph.height = graph_height;

    var y_axis = document.querySelector('.y_axis');
    y_axis.style.height = graph_height+'px';
    // label.padding-left + label.padding-right + arrow.border-left = 18
    var line_height = Math.round((graph_height - y_axis.querySelector('.label').clientHeight - 18) / 2);
    for (line of y_axis.querySelectorAll('.line'))
    {
      line.style.height = line_height+'px';
    }

    var x_axis = document.querySelector('.x_axis');
    x_axis.style.width = graph_width+'px';
    // label.padding-left + label.padding-right + arrow.border-left = 18
    var line_width = Math.round((graph_width - x_axis.querySelector('.label').clientWidth - 18) / 2);
    for (line of x_axis.querySelectorAll('.line'))
    {
      line.style.width = line_width+'px';
    }
    x_axis.style.marginLeft = y_axis.clientWidth+'px';

    var legend = document.querySelector('.legend');
    legend.style.maxWidth = graph_width + 'px';
    legend.style.marginLeft = Math.round((graph_width - legend.clientWidth) / 2) + 'px';
  }
}

window.onload = function()
{
  // Defaults
  NumBins = 100;
  IntensityThreshold = -4;
  FirstColorChangeThreshold = 16.5;
  SecondColorChangeThreshold = 27.5;
  RangeLimit = 100;
  ThinColor = 'green';
  ThickColor = 'red';
  VeryThickColor = 'blue';
  SayResultsOutLoud = false;
  SecondsToWaitBeforeSayingResults = 3;

  var cookie = document.cookie;
  cookie = cookie.slice(cookie.indexOf('TMSet=')+6);
  var idx = cookie.indexOf(';');
  if (idx != -1)
  {
    cookie = cookie.slice(0, idx);
  }
  cookie = cookie.split(',');
  if (cookie[0] == SETTINGS_VERSION && cookie.length == 11)
  {
    IntensityThreshold = cookie[1];
    FirstColorChangeThreshold = cookie[2];
    SecondColorChangeThreshold = cookie[3];
    NumBins = cookie[4];
    RangeLimit = cookie[5];
    ThinColor = cookie[6];
    ThickColor = cookie[7];
    VeryThickColor = cookie[8];
    SayResultsOutLoud = !!parseInt(cookie[9]);
    SecondsToWaitBeforeSayingResults = cookie[10];
  }

  document.querySelector('.num_bins_box').value = NumBins;
  document.querySelector('.intenisty_threshold_box').value = IntensityThreshold;
  document.querySelector('.first_color_change_threshold_box').value = FirstColorChangeThreshold;
  document.querySelector('.second_color_change_threshold_box').value = SecondColorChangeThreshold;
  document.querySelector('.range_limit_box').value = RangeLimit;
  document.querySelector('.thin_color_box').value = ThinColor;
  document.querySelector('.thick_color_box').value = ThickColor;
  document.querySelector('.very_thick_color_box').value = VeryThickColor;
  document.querySelector('.say_out_loud_box').checked = SayResultsOutLoud;
  document.querySelector('.seconds_to_wait_box').value = SecondsToWaitBeforeSayingResults;
}

var toggle_license = function()
{
  var license = document.querySelector('.license');
  if (license.style.display == 'none' || license.style.display == '')
  {
    if (!license.innerText.trim())
    {
      license.innerText = license.innerHTML.slice(4,-4);
    }
    license.style.display = 'inline';
  }
  else
  {
    license.style.display = 'none';
  }
}
