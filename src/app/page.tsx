/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Head from 'next/head';
import Script from 'next/script';
import { useCallback, useEffect, useRef } from 'react';
export const UI_CONFIG_NORMAL: object = {
  addSeekBar: false,
  controlPanelElements: [
    'play_pause',
    'time_and_duration',
    'mute',
    'volume',
    'spacer',
    'fullscreen',
  ],
};
export const UI_LOCALIZATION: object = {
  AD_DURATION: 'Thời lượng quảng cáo',
  AD_PROGRESS: 'Quảng cáo [AD_ON]/[NUM_ADS]',
  AD_TIME: 'Quảng cáo: [AD_TIME]',
  AUTO_QUALITY: 'Tự động',
  BACK: 'Quay lại',
  CAPTIONS: 'Phụ đề',
  CAST: 'Truyền...',
  ENTER_LOOP_MODE: 'Phát lại liên tục video hiện tại',
  ENTER_PICTURE_IN_PICTURE: 'Chuyển sang chế độ Hình trong hình',
  EXIT_FULL_SCREEN: 'Thoát toàn màn hình',
  EXIT_LOOP_MODE: 'Dừng phát lại liên tục video hiện tại',
  EXIT_PICTURE_IN_PICTURE: 'Thoát chế độ hình trong hình',
  FAST_FORWARD: 'Tua nhanh',
  FULL_SCREEN: 'Toàn màn hình',
  LANGUAGE: 'Ngôn ngữ',
  LIVE: 'LIVE',
  LOOP: 'Phát lại liên tục',
  MORE_SETTINGS: 'Cài đặt khác',
  MULTIPLE_LANGUAGES: 'Nhiều ngôn ngữ',
  MUTE: 'Tắt tiếng',
  NOT_APPLICABLE: 'Không áp dụng',
  OFF: 'Tắt',
  ON: 'Bật',
  PAUSE: 'Tạm dừng',
  PICTURE_IN_PICTURE: 'Chế độ hình trong hình',
  PLAY: 'Phát',
  PLAYBACK_RATE: 'Tốc độ phát',
  REPLAY: 'Phát lại',
  RESOLUTION: 'Độ phân giải',
  REWIND: 'Tua lại',
  SEEK: 'Tìm kiếm',
  SKIP_AD: 'Bỏ qua quảng cáo',
  SKIP_TO_LIVE: 'Tua tới chương trình phát trực tiếp',
  UNDETERMINED_LANGUAGE: 'Chưa xác định',
  UNMUTE: 'Bật tiếng',
  UNRECOGNIZED_LANGUAGE: 'Không xác định',
  VOLUME: 'Âm lượng',
};
export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerEleRef = useRef<HTMLDivElement>(null);
  const uiContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);

  const initFairPlaySigma = useCallback(() => {
    fetch('CERTIFICATE_URL')
      .then((res) => res.arrayBuffer())
      .then((res: any) => {
        let contentId: any;
        let licenseURL: any;
        playerRef.current.configure({
          drm: {
            servers: {
              'com.apple.fps.1_0': 'LICENSE_URL',
            },
            advanced: {
              'com.apple.fps.1_0': {
                serverCertificate: new Uint8Array(res),
              },
            },
          },
        });

        playerRef.current.configure(
          'drm.initDataTransform',
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          (initData: any, type: any, drmInfo: any) => {
            if (type != 'skd') return initData;
            const skdURL =
              window.shaka.util.StringUtils.fromBytesAutoDetect(initData);
            contentId = new URL(skdURL).searchParams.get('assetId');
            const cert = playerRef.current.drmInfo().serverCertificate;
            licenseURL = skdURL.replace('skd://', 'https://');
            return window.shaka.util.FairPlayUtils.initDataTransform(
              initData,
              contentId,
              cert,
            );
          },
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
              userId: 'userId',
              sessionId: 'sessionId',
              merchantId: 'merchantId',
              appId: 'appId',
            };
            request.uris = [licenseURL];
            request.method = 'POST';
            request.headers['Content-Type'] = 'application/json';
            request.headers['custom-data'] = btoa(JSON.stringify(dt));
            const originalPayload = new Uint8Array(request.body);
            const base64Payload =
              window.shaka.util.Uint8ArrayUtils.toStandardBase64(
                originalPayload,
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
                  response.data,
                );
                // Parse the JSON string into an object.
                const wrapped = JSON.parse(wrappedString);
                // This is a base64-encoded version of the raw license.
                const rawLicenseBase64 = wrapped.license;
                // Decode that base64 string into a Uint8Array and replace the response
                response.data =
                  window.shaka.util.Uint8ArrayUtils.fromBase64(
                    rawLicenseBase64,
                  );
              } catch {}
            }
          });

        playerRef.current
          .load('HLS_MANIFEST')
          .catch((e: Error) => console.error('Error loading video', e));
      })
      .catch((err) => {
        console.log('ERRORS_SIGMA: ', err.message);
      });
  }, [playerRef]);
  const init = async () => {
    if (
      typeof window === 'undefined' ||
      typeof window.shaka === 'undefined' ||
      typeof window.shaka.ui === 'undefined' ||
      !videoRef.current ||
      !uiContainerRef.current
    ) {
      return;
    }

    window.shaka.polyfill.installAll();
    window.shaka.polyfill.Orientation.install();
    window.shaka.polyfill.PatchedMediaKeysApple.install();
    window.shaka.log.setLevel(window.shaka.log.Level.V1);

    if (!window.shaka.Player.isBrowserSupported()) {
      console.error('Shaka Player not supported in this browser');
      return;
    }
    const player = new window.shaka.Player();
    await player.attach(videoRef.current);
    playerRef.current = player;

    // const ui = new window.shaka.ui.Overlay(
    //   player,
    //   videoContainerEleRef.current,
    //   videoRef.current,
    // );
    // ui.configure(UI_CONFIG_NORMAL);
    // ui?.getControls().getLocalization().changeLocale(['vi']);
    // ui?.getControls()
    //   .getLocalization()
    //   .insert('vi', new Map(Object.entries(UI_LOCALIZATION)));

    initFairPlaySigma();
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initFairPlaySigma]);

  return (
    <div>
      <Head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.12.6/controls.css"
          integrity="sha512-u93l7cZTAd0Hu/Ghr/yi1mo81cDSZTAI+CyvTs/AAZwGa9tVtIM51+N5h40aAfb0MOgl26WddHy27LPJJ1RWAA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </Head>

      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.12.6/shaka-player.compiled.debug.min.js"
        integrity="sha512-OMtkz3+rKoMVfpCFmlRGzpUT+xPG/zl8vXTogYclD7z15zrHOGsIyGnMpZkuwSFY2Mv73CL2aunkERBzmSxoqA=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        strategy="beforeInteractive"
      />

      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.12.6/shaka-player.ui.debug.min.js"
        integrity="sha512-dZZCdD5vzAd9E9kDye1xY/JzzflJW5CyHq3KIm+YT0KClWlD3AWfUmbJHvOSqbooxSrjNa556ng+I6GomKXjgA=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        strategy="beforeInteractive"
      />

      <div ref={videoContainerEleRef} style={{ maxWidth: 800, margin: 'auto' }}>
        <video
          ref={videoRef}
          width="800"
          style={{ backgroundColor: 'black' }}
          autoPlay
          controls
          muted
        />
        <div ref={uiContainerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
