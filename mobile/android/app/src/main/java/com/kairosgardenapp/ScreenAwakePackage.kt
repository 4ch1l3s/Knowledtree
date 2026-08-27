package com.kairosgardenapp

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

@Suppress("OVERRIDE_DEPRECATION")
class ScreenAwakePackage : ReactPackage {
  // Đăng ký module để JavaScript có thể gọi qua NativeModules.ScreenAwake.
  override fun createNativeModules(
    reactContext: ReactApplicationContext,
  ): List<NativeModule> = listOf(ScreenAwakeModule(reactContext))

  // Package này chỉ cung cấp hàm native, không tạo View native riêng.
  override fun createViewManagers(
    reactContext: ReactApplicationContext,
  ): List<ViewManager<*, *>> = emptyList()
}
