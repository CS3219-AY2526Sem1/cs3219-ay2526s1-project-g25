#!/usr/bin/env python3
# Usage: python3 sync_vercel_env.py <env-file> <environment>

import os
import sys
import subprocess

def run_cmd(cmd, input_text = None):
    return subprocess.run(cmd, input=input_text, text=True, capture_output=True, check=True)

def main():
    if len(sys.argv) != 3:
        print("Usage: python3 sync_vercel_env.py <env-file> <environment>")
        sys.exit(1)

    env_file = sys.argv[1]
    target_env = sys.argv[2]

    # vercel_token = os.environ.get("VERCEL_TOKEN")
    vercel_token = "S24aMfBSdGkAopqwv5vQJBWO"

    if not vercel_token:
        print("Error: VERCEL_TOKEN environment variable not set.")
        sys.exit(1)

    if not os.path.isfile(env_file):
        print("Error: .env file does not exist.")
        sys.exit(1)

    try:
        result = run_cmd(["vercel", "env", "ls", "--token", vercel_token])
        if len(result.stdout) == 0:
            print("No env vars detected.")
        else:
            # Parse the output, which is one long formatted string.
            split_nonempty_output_lines = list(filter(lambda line: len(line.strip()) > 0, result.stdout.split("\n")))
            # print(split_nonempty_output_lines)
            existing_vars = list(map(lambda line: list(filter(lambda x: x, line.split(" ")))[0], split_nonempty_output_lines))

            # Index 0 is the table header.
            for i in range(1, len(existing_vars)):
                print(f"Deleting Vercel env var {existing_vars[i]}...")
                run_cmd(["vercel", "env", "rm", f"{existing_vars[i]}", target_env, "--token", vercel_token, "--yes"])
                print("Deleted. \n")

    except subprocess.CalledProcessError as e:
       print(f"Failed with error: {e.stderr}")

    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            
            if "=" not in line:
                print("Skipping invalid line.")
 
            print(line)
            key, value = line.split("=", 1)
            value = value.strip('"').strip("'")
            print(f"Adding {key} to Vercel...")
 
            try:
                run_cmd(["vercel", "env", "add", key, target_env, "--token", vercel_token], input_text = value)
                print("Added. \n")
            except subprocess.CalledProcessError as e:
                print(f"Failed to add {key}: {e.stderr}")
 
    print("Vercel ENV vars synced.")


if __name__ == "__main__":
    main()
