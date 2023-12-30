var second = [0];
var faceCount = parseInt($("#faceCount").val());
var signInCount = parseInt($("#signIn_count").val());
var isSpeed = parseInt($("#video_speed_state").val());
var learnState = parseInt($("#learn_state").val());
var rateState = true;
var startFace = parseInt($("#start_face_state").val());
var endFace = parseInt($("#end_face_state").val());
//人脸识别模式（0-开始，1中间，2-结束）
var faceMobule = 0;
$(function () {
  if (startFace != 1) {
    //添加播放日志
    AddPlayTime();
    AddCookieValue("pc_course_play_state", "1", 10);
  }
});

/**
 * cc h5
 * */
var htPlayer;
var ccH5 = {
  createPlayer: function (vid, objId, width, height, progressbar_enable) {
    if (width == null || width == undefined) {
      width = "100%";
    }
    if (height == null || height == undefined) {
      height = "100%";
    }
    var options = {
      vid: vid,
      siteid: "52863F54B654B651",
      mediatype: 1,
      autoStart: true, //是否自动播放（Chrome等部分浏览器会存限制导致无法自动播放，若需要绕过浏览器限制请使用参数 静音自动播放-realAutoPlay ）
      realAutoPlay: true,
      width: width,
      height: height,
      progressbar_enable: 1, // 1可以拖动  0不可拖动
      showRateBtn: rateState,
      rate_allow_change: rateState, //是否显示倍速  ture 显示 false 不现实
      rate_array: [0.5, 1, 1.5, 2],
      rate: 2,
      isShare: "false", //是否显示分享
      playtype: checkVideo(), // 1 h5 默认 CC
      isShowQuestions: false, //是否显示问答
      parentNode: objId,
      closeHistoryTime: 1,
      banDrag: true,
      //,
      //signConfig: {
      //seconds: second, // 签到时间点，支持设置1-5个时间点
      //logo: '', // 签到logo
      //title: '学习签到', // 默认：学习签到
      //content: $("#signIn_message").val(), // 默认：请点击签到，签到后可继续学习
      //btnText: '点击签到' // 默认：签到
      //}
    };
    var actionOpt = [
      {
        index: 0,
        duration: 20000,
        start: {
          xpos: 0.012,
          ypos: 0,
          alpha: 0.8,
        },
        end: {
          xpos: 0.912,
          ypos: 0.823,
          alpha: 0.8,
        },
      },
    ];
    if (parseInt($("#if_show_lamp").val()) == 1) {
      options.marquee = {
        loop: -1,
        type: "image",
        image: {
          image_url: $("#lamp_image_url").val(),
          width: "200",
          height: "50",
        },
        action: actionOpt,
      };
    } else if (parseInt($("#if_show_lamp").val()) == 2) {
      options.marquee = {
        loop: -1,
        type: "text",
        text: {
          content: $("#lamp_text_content").val(),
          font_size: "20",
          color: "#FF920A",
        },
        action: actionOpt,
      };
    }
    htPlayer = window.createCCH5Player(options);
  },
};

//cch5播放初始化
function onCCH5PlayerLoaded() {
  var duration = parseInt($("#courseware_duration").val());
  if (faceCount <= 0 && duration > 0 && signInCount > 0) {
    second = new Array();
    var number = parseInt(duration / (signInCount + 1));
    for (var i = 1; i <= signInCount; i++) {
      second.push(number * i);
    }
  }
  if (startFace != 1) {
    ccH5.createPlayer(
      $("#ccVid").val(),
      "#ccVideo-box",
      "100%",
      "100%",
      $("#progressbar_enable").val()
    );
  } else {
    faceMobule = 0;
    $(".button_box button").attr("disabled", "disabled");
    //加载二维码
    LoadQrCode();
    $(".mask").show();
    $(".popup_box").show();
  }
}

var faceData = [];
//播放器初始化完成即将播放时回调
function on_CCH5player_ready(obj) {
  /* 调用播放器api样例_设置音量*/
  window.cc_js_Player.setVolume(0.5);

  //如果设置不让拖动，则设置前进的进度为0
  if ($("#progressbar_enable").val() == "0") {
    window.cc_js_Player.fast_forward_time(0);
  }
  var playTimeNum = parseInt($("#PlayTime").val());
  htPlayer.jumpToTime(playTimeNum);
  htPlayer.play();
  //获取人脸识别次数
  if (faceCount > 0) {
    var timer = setInterval(function () {
      //获取播放总时长
      var totalTime = on_CCH5player_getDuration();
      if (totalTime != undefined && totalTime != null) {
        var number = parseInt(totalTime / (faceCount + 1));
        for (var i = 1; i <= faceCount; i++) {
          faceData.push({ time: number * i, isFace: false });
        }
        clearInterval(timer);
      }
    }, 300);
  }
  TimerPlay();
}

var number = 0;
var currentTime;
//定时获取播放时长，对比是否需要弹出人脸识别
var faceAllEnd = false;
function TimerPlay() {
  videoTimer = setInterval(function () {
    if (faceData.length > 0) {
      currentTime = parseInt(on_CCH5player_getPosition());
      //var isTrue = false;
      //判断如果没有需要人脸识别的时间点，停止人脸识别判断
      //if (faceAllEnd == false) {
      for (var i = 0; i < faceData.length; i++) {
        //if (faceData[i].isFace === false) {
        //    isTrue = true;
        //}
        //判断到人脸是否时间点，且未进行人脸识别，则弹出人脸识别二维码
        if (
          faceData[i].isFace === false &&
          faceData[i].time >= currentTime &&
          faceData[i].time <= currentTime + 4
        ) {
          faceMobule = 1;
          window.cc_js_Player.normalScreen();
          $(".button_box button").attr("disabled", "disabled");
          //视频暂停
          htPlayer.pause();
          //加载二维码
          LoadQrCode();
          $(".mask").show();
          $(".popup_box").show();
          break;
        }
        //}
        //if (!isTrue) {
        //    faceAllEnd = true;
        //}
      }
    }
    var playTime = parseInt(on_CCH5player_getPosition());
    var playTotalTime = parseInt(on_CCH5player_getDuration());
    //var playTime = playTotalTime;
    //如果播放时长小于视频总时长，更新播放时长
    if (playTime + 10 >= playTotalTime) {
      //停止计时器
      clearInterval(videoTimer);
      if (endFace != 1) {
        //保存学习记录
        SaveLearningTime(1, playTime, playTotalTime);
        var allTime = parseInt(on_CCH5player_getDuration());
        //更新日志记录
        UpdatePlayTime($("#HdPlayLogId").val(), allTime, 1);
      } else {
        faceMobule = 2;
        $(".button_box button").attr("disabled", "disabled");
        //加载二维码
        LoadQrCode();
        $(".mask").show();
        $(".popup_box").show();
      }
    } else if (playTime < playTotalTime) {
      if (number >= 60) {
        var logId = $("#HdPlayLogId").val();
        if (logId != null && logId !== "") {
          if (playTime > 0) {
            UpdatePlayTime(logId, playTime, 0);
          }
          number = 0;
        } else {
          AddPlayTime();
        }
      } else {
        number++;
      }
    }
    //else {
    //    clearInterval(videoTimer);
    //}
  }, 1000);
}

//人脸识别结束，继续学习
function ContinueLearning() {
  $(".mask").hide();
  $(".popup_box").hide();
  if (faceMobule == 0) {
    //添加播放日志
    AddPlayTime();
    AddCookieValue("pc_course_play_state", "1", 10);
    ccH5.createPlayer(
      $("#ccVid").val(),
      "#ccVideo-box",
      "100%",
      "100%",
      $("#progressbar_enable").val()
    );
  } else if (faceMobule == 2) {
    //停止计时器
    clearInterval(videoTimer);
    var allTime = parseInt(on_CCH5player_getDuration());
    var playTime = parseInt(on_CCH5player_getPosition());
    //保存学习记录
    SaveLearningTime(1, playTime, allTime);
    //更新日志记录
    UpdatePlayTime($("#HdPlayLogId").val(), allTime, 1);
  } else {
    //视频播放
    htPlayer.play();
    videoTimer = 0;
    //开启视频播放计时器
    TimerPlay();
    //判断已完成人脸识别的节点，设置状态为true
    for (var i = 0; i < faceData.length; i++) {
      if (
        faceData[i].isFace == false &&
        faceData[i].time >= currentTime &&
        faceData[i].time <= currentTime + 4
      ) {
        faceData[i].isFace = true;
        break;
      }
    }
  }
}

//播放时回调
function on_CCH5player_play(video, vid) {}
//暂停时回调
function on_CCH5player_pause(video, vid) {}
//播放结束时回调
function on_CCH5player_ended(video, vid) {
  //停止计时器
  clearInterval(videoTimer);
  if (endFace != 1) {
    var allTime = parseInt(on_CCH5player_getDuration());
    var playTime = parseInt(on_CCH5player_getPosition());
    //保存学习记录
    SaveLearningTime(1, playTime, allTime);
    //更新日志记录
    UpdatePlayTime($("#HdPlayLogId").val(), allTime, 1);
  } else {
    if ($(".popup_box").is(":hidden")) {
      faceMobule = 2;
      $(".button_box button").attr("disabled", "disabled");
      //加载二维码
      LoadQrCode();
      $(".mask").show();
      $(".popup_box").show();
    }
  }
}

//获取视频总时长
function on_CCH5player_getDuration() {
  return htPlayer.getDuration();
}

//获取视频播放时长
function on_CCH5player_getPosition() {
  return htPlayer.getPosition();
}

//跳过问答的回调
function on_player_qa_skip(obj, vid) {
  console.log(obj);
}

//问答结果回调
function on_player_qa_result(obj, vid) {
  console.log(obj);
}

//签到结果的回调
function on_player_sign_result(second, vid) {
  Common.CreateAJAXRequest(
    "/Exercise/ExerciseCourse/SaveCoursewareSignIn",
    "POST",
    {
      user_id: $("#user_id").val(),
      learningplan_courseware_id: $("#title_id").val(),
      second: second,
    },
    "json",
    function (json) {
      if (json.state === messageState.success) {
        console.log("成功");
      } else {
        CustomAlter("提示", "签到失败！");
      }
    },
    null
  );
}

//判断浏览器是否支持h5
function checkVideo() {
  if (!!document.createElement("video").canPlayType) {
    var vidTest = document.createElement("video");
    oggTest = vidTest.canPlayType('video/ogg; codecs="theora, vorbis"');
    if (!oggTest) {
      h264Test = vidTest.canPlayType(
        'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
      );
      if (!h264Test) {
        //不支持
        return "2";
      } else {
        if (h264Test == "probably") {
          //肯定支持。
          return "1";
        } else {
          //可能支持 H5播放
          return "2";
        }
      }
    } else {
      if (oggTest == "probably") {
        //肯定支持
        return "1";
      } else {
        //可能支持
        return "2";
      }
    }
  } else {
    return "2";
  }
}
