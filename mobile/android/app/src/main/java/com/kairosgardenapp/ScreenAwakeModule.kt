package com.kairosgardenapp

import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ScreenAwakeModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  // Tên này phải trùng với NativeModules.ScreenAwake bên phía React Native.
  override fun getName(): String = NAME

  @ReactMethod
  fun setKeepScreenOn(enabled: Boolean) {
    // Module có thể được gọi khi Activity chưa sẵn sàng; lúc đó bỏ qua để tránh crash.
    val activity = reactApplicationContext.currentActivity ?: return

    // Thay đổi cờ của Window bắt buộc chạy trên UI thread của Android.
    activity.runOnUiThread {
      if (enabled) {
        // Giữ màn hình sáng trong lúc đang có phiên tập trung.
        activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      } else {
        // Trả lại hành vi tự tắt màn hình bình thường khi phiên kết thúc hoặc component bị đóng.
        activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      }
    }
  }

  companion object {
    const val NAME = "ScreenAwake"
  }
}
