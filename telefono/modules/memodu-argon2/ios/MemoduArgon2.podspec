Pod::Spec.new do |s|
  s.name           = 'MemoduArgon2'
  s.version        = '1.0.0'
  s.summary        = 'Argon2id nativo con libsodium per Memodu'
  s.author         = 'Memodu'
  s.homepage       = 'https://github.com/'
  s.license        = 'ISC'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  # libsodium 1.0.21 già compilata (Clibsodium.xcframework, dal pacchetto react-native-libsodium,
  # che non si compila con React Native 0.88 e resta escluso dall'autolinking).
  s.vendored_frameworks = 'Clibsodium.xcframework'
  s.source_files = '*.swift'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
