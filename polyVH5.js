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
    polyVH5.createPolyV(
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
  if (startFace != 1) {
    //添加播放日志
    AddPlayTime();
    AddCookieValue("pc_course_play_state", "1", 10);
  }
});

var polyV;
var polyVH5 = {
  createPolyV: function (vid, objId, width, height, progressbar_enable) {
    if (width == null || width == undefined) {
      width = "100%";
    }
    if (height == null || height == undefined) {
      height = "100%";
    }
    var ts = new Date().valueOf();
    var sign = $.md5("NWZxv5O8lk" + vid + ts);
    polyV = polyvPlayer({
      wrap: objId,
      width: width,
      height: height,
      vid: vid,
      preventKeyboardEvent: true, // 禁止屏蔽键盘事件
      forceH5: true, //默认打开HTML5 播放器
      hideSwitchPlayer: true,
      ban_seek_by_limit_time: "off", //是否禁止视频拖拽未播放区域 默认off
      //ban_seek: progressbar_enable == "0" ? "on" : "off", //on不可拖动,off可拖动，默认off
      speed: rateState, //false关闭倍速
      autoplay: true, //自动播放
      maxPlaybackRateLimit: 2.5,
      ban_history_time: "off", //是否禁用续播功能：
      is_interaction: "off", //on打开过程题,off关闭过程题(保利威后台题目)
      ts: ts,
      sign: sign,
      preview: false,
      playsafe: function (vid, next) {
        $.ajax({
          url: "/Exercise/ExerciseCourse/GetPlaySafeToken",
          data: { vid: vid, user_id: $("#user_id").val() },
        }).done(function (res) {
          next(res);
        });
      },
    });
  },
};

//播放器初始化完毕时触发
window.s2j_onPlayerInitOver = function (params) {
  var playTimeNum = parseInt($("#PlayTime").val());
  polyV.j2s_seekVideo(playTimeNum);
  polyV.j2s_resumeVideo();
};

var faceData = [];
// 视频初次播放时触发
window.s2j_onPlayStart = function () {
  //获取人脸识别次数
  if (faceCount > 0) {
    var timer = setInterval(function () {
      //获取播放总时长
      var totalTime = polyV.j2s_getDuration();
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
};

//播放完毕执行函数
window.s2j_onPlayOver = function () {
  //停止计时器
  clearInterval(videoTimer);
  if (endFace != 1) {
    var allTime = parseInt(polyV.j2s_getDuration());
    var playTime = parseInt(polyV.j2s_getCurrentTime());
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
};

//视频暂停时触发
window.s2j_onVideoPause = function () {};

var number = 0;
var currentPlayTime;
var faceAllEnd = false;
//定时获取播放时长，对比是否需要弹出人脸识别
function TimerPlay() {
  var firstRun = true;

  videoTimer = setInterval(function () {
    if (faceData.length > 0) {
      currentPlayTime = parseInt(polyV.j2s_getCurrentTime());
      var isTrue = false;
      //判断如果没有需要人脸识别的时间点，停止人脸识别判断
      if (faceAllEnd == false) {
        for (var i = 0; i < faceData.length; i++) {
          if (faceData[i].isFace === false) {
            isTrue = true;
          }
          //判断到人脸是否时间点，且未进行人脸识别，则弹出人脸识别二维码
          if (
            faceData[i].isFace === false &&
            faceData[i].time >= currentPlayTime &&
            faceData[i].time <= currentPlayTime + 4
          ) {
            faceMobule = 1;
            $(".button_box button").attr("disabled", "disabled");
            //视频暂停
            polyV.j2s_pauseVideo();
            //加载二维码
            LoadQrCode();
            $(".mask").show();
            $(".popup_box").show();
            break;
          }
        }
        if (!isTrue) {
          faceAllEnd = true;
        }
      }
    }
    var playTotalTime = parseInt(polyV.j2s_getDuration());
    var playTime = firstRun
      ? playTotalTime - 90
      : parseInt(polyV.j2s_getCurrentTime());

    if (firstRun) {
      polyV.j2s_seekVideo(playTime);
      SaveLearningTime(0, playTime, playTotalTime);
      firstRun = false;
    }
    //如果播放时长小于视频总时长，更新播放时长
    if (playTime + 10 >= playTotalTime) {
      //停止计时器
      clearInterval(videoTimer);
      if (endFace != 1) {
        //保存学习记录
        SaveLearningTime(1, playTime, playTotalTime);
        //更新日志记录
        UpdatePlayTime($("#HdPlayLogId").val(), playTotalTime, 1);
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
    } else {
      clearInterval(videoTimer);
    }
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
    polyVH5.createPolyV(
      $("#ccVid").val(),
      "#ccVideo-box",
      "100%",
      "100%",
      $("#progressbar_enable").val()
    );
  } else if (faceMobule == 2) {
    //停止计时器
    clearInterval(videoTimer);
    var allTime = parseInt(polyV.j2s_getDuration());
    var playTime = parseInt(polyV.j2s_getCurrentTime());
    //保存学习记录
    SaveLearningTime(1, playTime, allTime);
    //更新日志记录
    UpdatePlayTime($("#HdPlayLogId").val(), allTime, 1);
  } else {
    //视频播放
    polyV.j2s_resumeVideo();
    videoTimer = 0;
    //开启视频播放计时器
    TimerPlay();
    //判断已完成人脸识别的节点，设置状态为true
    for (var i = 0; i < faceData.length; i++) {
      if (
        faceData[i].isFace == false &&
        faceData[i].time >= currentPlayTime &&
        faceData[i].time <= currentPlayTime + 4
      ) {
        faceData[i].isFace = true;
        break;
      }
    }
  }
}
