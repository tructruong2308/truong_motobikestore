@echo off
setlocal
rem Dùng Unicode để không lỗi tiếng Việt trong đường dẫn
chcp 65001 >nul

rem Nhảy vào đúng thư mục chứa file .bat (khỏi cần đường dẫn dài/tiếng Việt)
pushd "%~dp0"

rem ---- Cấu hình đường dẫn PHP tại đây (xem 'where php')
set "PHP=C:\xampp\php\php.exe"

if not exist "%PHP%" (
  echo Khong tim thay PHP tai: %PHP%
  pause
  exit /b 1
)

rem Mo 2 cua so CMD: Laravel serve + Reverb
start "Laravel Serve"  "%ComSpec%" /k ""%PHP%" artisan serve --host=127.0.0.1 --port=8000"
start "Laravel Reverb" "%ComSpec%" /k ""%PHP%" artisan reverb:start --host=127.0.0.1 --port=6001"

rem Neu ban dung queue cho event:
rem start "Queue Worker" "%ComSpec%" /k ""%PHP%" artisan queue:work"

exit /b
