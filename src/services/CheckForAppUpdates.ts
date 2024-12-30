import { check } from "@tauri-apps/plugin-updater";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import { toast } from "../hooks/use-toast";

export async function checkForAppUpdates(onUserClick: boolean) {
  try {
    const update = await check();

    // if (update === null) {
    //   await message("Failed to check for updates.\nPlease try again later.", {
    //     title: "Error",
    //     kind: "error",
    //     okLabel: "OK",
    //   });
    //   return;
    // }

    if (update?.available) {
      const yes = await ask(
        `Update to ${update.version} is available!\n\nRelease notes: ${update.body}`,
        {
          title: "Update Available",
          kind: "info",
          okLabel: "Update",
          cancelLabel: "Cancel",
        }
      );

      if (yes) {
        let downloaded = 0;
        let contentLength = 0;

        const { update: updateToast, dismiss: dismissToast } = toast({
          title: "Update in Progress",
          description: "Starting download...",
          duration: 0,
        });

        try {
          await update.downloadAndInstall((event) => {
            switch (event.event) {
              case "Started":
                contentLength = event.data.contentLength ?? 0;
                console.log(`Started downloading ${contentLength} bytes`);
                updateToast({
                  id: "update-started",
                  description: `Download started...`,
                });
                break;

              case "Progress":
                downloaded += event.data.chunkLength;
                const percentage = contentLength
                  ? ((downloaded / contentLength) * 100).toFixed(2)
                  : "0";
                updateToast({
                  id: "update-progress",
                  description: `Downloaded ${percentage}%`,
                });
                console.log(`Progress: ${percentage}%`);
                break;

              case "Finished":
                updateToast({
                  id: "update-finished",
                  title: "Download Complete",
                  description: "Installing the update...",
                });
                console.log("Download finished");
                break;
            }
          });

          console.log("Update installed. Relaunching...");
          dismissToast();
          await relaunch();
        } catch (err) {
          dismissToast();
          console.error("Update failed:", err);
          toast({
            title: "Update Failed",
            description: "There was an error during the update process.",
            duration: 5000,
          });
        }
      }
    } else if (onUserClick) {
      await message("You are on the latest version. Stay awesome!", {
        title: "No Update Available",
        kind: "info",
        okLabel: "OK",
      });
    }
  } catch (err) {
    console.error("Error checking for updates:", err);
    await message("Failed to check for updates.\nPlease try again later.", {
      title: "Error",
      kind: "error",
      okLabel: "OK",
    });
  }
}
