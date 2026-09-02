import os
import sys
import subprocess
import threading
import time
import signal
import socket

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

processes = []

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def free_port(port):
    if not is_port_in_use(port):
        return
    print(f"\033[1;33m[Launcher] Port {port} is in use. Clearing previous instance...\033[0m")
    if sys.platform == "win32":
        try:
            output = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True, text=True)
            for line in output.strip().splitlines():
                if "LISTENING" in line:
                    parts = line.strip().split()
                    pid = parts[-1]
                    if pid.isdigit() and int(pid) != os.getpid():
                        subprocess.call(["taskkill", "/F", "/PID", pid], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass
    time.sleep(1)

def stream_output(process, prefix, color_code):
    try:
        for line in iter(process.stdout.readline, ''):
            if not line:
                break
            sys.stdout.write(f"\033[{color_code}m[{prefix}]\033[0m {line}")
            sys.stdout.flush()
    except Exception:
        pass

def cleanup(sig=None, frame=None):
    print("\n\033[1;33m[Launcher] Stopping services...\033[0m")
    for p in processes:
        try:
            if sys.platform == "win32":
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                p.terminate()
        except Exception:
            pass
    print("\033[1;32m[Launcher] All services stopped cleanly.\033[0m")
    sys.exit(0)

def main():
    signal.signal(signal.SIGINT, cleanup)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, cleanup)

    print("\033[1;36m" + "=" * 65)
    print("  AI RESEARCH FUNDING & INNOVATION INTELLIGENCE PLATFORM")
    print("  Full Stack Development Environment Launcher")
    print("=" * 65 + "\033[0m\n")

    # Ensure ports 8000 and 5173 are free
    free_port(8000)
    free_port(5173)

    # 1. Start Backend
    print("\033[1;34m[Launcher] Starting FastAPI Backend on http://127.0.0.1:8000 ...\033[0m")
    backend_cmd = [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append(backend_proc)

    # 2. Start Frontend
    print("\033[1;32m[Launcher] Starting React Vite Frontend on http://localhost:5173 ...\033[0m")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append(frontend_proc)

    # Spawn threads to stream logs
    t_backend = threading.Thread(target=stream_output, args=(backend_proc, "Backend", "34"), daemon=True)
    t_frontend = threading.Thread(target=stream_output, args=(frontend_proc, "Frontend", "32"), daemon=True)
    t_backend.start()
    t_frontend.start()

    time.sleep(2)
    print("\n\033[1;32m" + "✔ Services are running!" + "\033[0m")
    print("  - Frontend App:   \033[4;36mhttp://localhost:5173\033[0m")
    print("  - Backend API:    \033[4;36mhttp://127.0.0.1:8000\033[0m")
    print("  - API Swagger:    \033[4;36mhttp://127.0.0.1:8000/docs\033[0m")
    print("\n\033[90mPress Ctrl+C anytime to shutdown both services.\033[0m\n")

    try:
        while True:
            time.sleep(1)
            if backend_proc.poll() is not None:
                print(f"\033[1;31m[Launcher] Backend exited with code {backend_proc.returncode}\033[0m")
                break
            if frontend_proc.poll() is not None:
                print(f"\033[1;31m[Launcher] Frontend exited with code {frontend_proc.returncode}\033[0m")
                break
    except KeyboardInterrupt:
        pass
    finally:
        cleanup()


if __name__ == "__main__":
    main()
