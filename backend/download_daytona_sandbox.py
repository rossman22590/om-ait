import time
import os
from daytona import Daytona

SANDBOX_ID = "4ec2d341-4ef9-4473-a699-2925173b6ced"
DOWNLOAD_DIR = "sandbox_project_download"


def wait_for_ip(sandbox, timeout=120, interval=5):
    print("Waiting for sandbox to start and get IP address...")
    for _ in range(timeout // interval):
        sandbox.refresh()
        ip = getattr(sandbox, "ip_address", None)
        state = getattr(sandbox, "state", None)
        print(f"State: {state}, IP: {ip}")
        if ip and state == "STARTED":
            return True
        time.sleep(interval)
    return False


def download_project_dir(sandbox, target_dir):
    print(f"Downloading project directory from sandbox {sandbox.id}...")
    files = sandbox.list_project_files()
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
    for file_info in files:
        rel_path = file_info["path"]
        print(f"Downloading {rel_path}...")
        content = sandbox.download_project_file(rel_path)
        local_path = os.path.join(target_dir, rel_path)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(content)
    print(f"✓ Download complete. Files saved to {target_dir}")


def main():
    daytona = Daytona()
    sandbox = daytona.get(SANDBOX_ID)
    state = getattr(sandbox, "state", None)
    print(f"Sandbox state: {state}")
    if state != "STARTED":
        print("Starting sandbox...")
        sandbox.start()
        if not wait_for_ip(sandbox):
            print("✗ Sandbox did not start or get IP address in time.")
            return
    download_project_dir(sandbox, DOWNLOAD_DIR)

if __name__ == "__main__":
    main()
