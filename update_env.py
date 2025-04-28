import socket

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Doesn't need to actually connect
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

def update_env(ip):
    lines = [
        f"VITE_DJANGO_API=http://{ip}:8000",
        f"VITE_FLASK_API=http://{ip}:5000",
        f"VITE_WS_URL=ws://{ip}:8000"
    ]

    with open(".env", "w") as f:
        f.write("\n".join(lines))

    print(f".env file updated with local IP: {ip}")

if __name__ == "__main__":
    ip = get_local_ip()
    update_env(ip)