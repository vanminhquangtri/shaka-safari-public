/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";

export const useDrmPlayer = ({ playerRef }: { playerRef: any }) => {
  // const initFairPlaySigma = useCallback(() => {
  //   fetch(`https://cert.sigmadrm.com/app/fairplay/sigma_packager_lite/demo`)
  //     .then(async (res) => res.arrayBuffer())
  //     .then(async (res: any) => {
  //       let licenseURL: any;
  //       const cert = new Uint8Array(res);
  //       console.log("cert ", cert);

  //       playerRef.current.configure({
  //         drm: {
  //           servers: {
  //             "com.apple.fps.1_0":
  //               "https://license.sigmadrm.com/license/verify/fairplay",
  //             // 'com.apple.fps': licenseURL
  //           },
  //           advanced: {
  //             "com.apple.fps.1_0": {
  //               serverCertificate: new Uint8Array(res),
  //             },
  //           },
  //         },
  //       });

  //       playerRef.current.configure(
  //         "drm.initDataTransform",
  //         // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //         (initData: any, type: any, drmInfo: any) => {
  //           if (type != "skd") return initData;
  //           const skdURL =
  //             window.shaka.util.StringUtils.fromBytesAutoDetect(initData);
  //           console.log("skdURL", skdURL);
  //           const contentId = new URL(skdURL).searchParams.get("assetId");
  //           const cert = playerRef.current.drmInfo().serverCertificate;
  //           licenseURL = skdURL.replace("skd://", "https://");
  //           return window.shaka.util.FairPlayUtils.initDataTransform(
  //             initData,
  //             contentId,
  //             cert
  //           );
  //         }
  //       );
  //       // const packInfo = window.sigmaPacker.getDataPacker() || {};
  //       const networkingEngine = playerRef.current.getNetworkingEngine();
  //       // networkingEngine.clearAllRequestFilters();
  //       // networkingEngine.clearAllResponseFilters();

  //       networkingEngine.registerRequestFilter((type: any, request: any) => {
  //         if (type !== window.shaka.net.NetworkingEngine.RequestType.LICENSE) {
  //           return;
  //         }
  //         try {
  //           request.uris = [licenseURL];
  //           request.method = "POST";
  //           request.headers["Content-Type"] = "application/json";
  //           const dt = {
  //             userId: "shaka-nextjs-userid",
  //             sessionId: "shaka-nextjs-userid",
  //             merchantId: "sigma_packager_lite",
  //             appId: "demo",
  //             // reqId: packInfo.requestId,
  //             // deviceInfo: packInfo.deviceInfo,
  //           };
  //           request.headers["custom-data"] = btoa(JSON.stringify(dt));
  //           const originalPayload = new Uint8Array(request.body);
  //           const base64Payload =
  //             window.shaka.util.Uint8ArrayUtils.toStandardBase64(
  //               originalPayload
  //             );
  //           request.body = JSON.stringify({
  //             spc: base64Payload,
  //             assetId: new URL(licenseURL).searchParams.get("assetId"),
  //           });
  //           console.log("Request license: ", request);
  //         } catch (error) {
  //           console.log("registerRequestFilter", error);
  //         }
  //       });

  //       networkingEngine.registerResponseFilter(function (
  //         type: any,
  //         response: any
  //       ) {
  //         if (type == window.shaka.net.NetworkingEngine.RequestType.LICENSE) {
  //           // This is the wrapped license, which is a JSON string.
  //           try {
  //             const wrappedString = window.shaka.util.StringUtils.fromUTF8(
  //               response.data
  //             );
  //             // Parse the JSON string into an object.
  //             const wrapped = JSON.parse(wrappedString);
  //             // This is a base64-encoded version of the raw license.
  //             const rawLicenseBase64 = wrapped.license;
  //             // Decode that base64 string into a Uint8Array and replace the response
  //             response.data =
  //               window.shaka.util.Uint8ArrayUtils.fromBase64(rawLicenseBase64);
  //           } catch (err) {
  //             console.error("Failed to parse license: ", err);
  //           }
  //         }
  //       });
  //     })
  //     .catch((err) => {
  //       console.log("ERRORS_SIGMA: ", err.message);
  //     });
  // }, [playerRef]);

  const initFairPlaySigma = useCallback(() => {
    fetch("https://cert.sigmadrm.com/app/fairplay/sigma_packager_lite/demo")
      .then((res) => res.arrayBuffer())
      .then((res: any) => {
        let contentId: any;
        let licenseURL: any;
        const cert = new Uint8Array(res);
        console.log("cert ", cert);

        playerRef.current.configure({
          drm: {
            servers: {
              "com.apple.fps.1_0":
                "https://license.sigmadrm.com/license/verify/fairplay",
            },
            advanced: {
              "com.apple.fps.1_0": {
                serverCertificate: new Uint8Array(res),
              },
            },
          },
        });

        playerRef.current.configure(
          "drm.initDataTransform",
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          (initData: any, type: any, drmInfo: any) => {
            if (type != "skd") return initData;
            const skdURL =
              window.shaka.util.StringUtils.fromBytesAutoDetect(initData);
            contentId = new URL(skdURL).searchParams.get("assetId");
            const cert = playerRef.current.drmInfo().serverCertificate;
            licenseURL = skdURL.replace("skd://", "https://");
            return window.shaka.util.FairPlayUtils.initDataTransform(
              initData,
              contentId,
              cert
            );
          }
        );
        const networkingEngine = playerRef.current.getNetworkingEngine();
        networkingEngine.clearAllRequestFilters();
        networkingEngine.clearAllResponseFilters();
        networkingEngine.registerRequestFilter((type: any, request: any) => {
          if (type !== window.shaka.net.NetworkingEngine.RequestType.LICENSE) {
            return;
          }
          try {
            const dt = {
              userId: "shaka-nextjs-userid",
              sessionId: "shaka-nextjs-userid",
              merchantId: "sigma_packager_lite",
              appId: "demo",
            };
            request.uris = [licenseURL];
            request.method = "POST";
            request.headers["Content-Type"] = "application/json";
            request.headers["custom-data"] = btoa(JSON.stringify(dt));
            const originalPayload = new Uint8Array(request.body);
            const base64Payload =
              window.shaka.util.Uint8ArrayUtils.toStandardBase64(
                originalPayload
              );
            request.body = JSON.stringify({
              spc: base64Payload,
              assetId: contentId,
            });
          } catch (error) {
            console.log({ error });
          }
        });

        playerRef.current
          .getNetworkingEngine()
          .registerResponseFilter(function (type: any, response: any) {
            if (type == window.shaka.net.NetworkingEngine.RequestType.LICENSE) {
              // This is the wrapped license, which is a JSON string.
              try {
                const wrappedString = window.shaka.util.StringUtils.fromUTF8(
                  response.data
                );
                // Parse the JSON string into an object.
                const wrapped = JSON.parse(wrappedString);
                // This is a base64-encoded version of the raw license.
                const rawLicenseBase64 = wrapped.license;
                // Decode that base64 string into a Uint8Array and replace the response
                response.data =
                  window.shaka.util.Uint8ArrayUtils.fromBase64(
                    rawLicenseBase64
                  );
              } catch {}
            }
          });
      })
      .catch((err) => {
        console.log("ERRORS_SIGMA: ", err.message);
      });
  }, [playerRef]);

  return { initFairPlaySigma };
};
