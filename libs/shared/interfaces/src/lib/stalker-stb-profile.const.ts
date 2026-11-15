/**
 * The set-top box IPTVnator presents itself as. Every value here is a constant
 * describing the emulated device, never anything derived from the user's
 * account — the identity the portal binds to a MAC lives in `device_id` /
 * `device_id2` and is handled separately.
 *
 * The stock Stalker middleware reads these on `get_profile` and stores them
 * for the admin panel; only an operator's optional `access_filter.php` ever
 * inspects them, and a box that reports nothing at all is the shape some of
 * those filters reject. They are therefore free to send and worth sending —
 * but only as one coherent box: the model, firmware, hardware revision and
 * image version have to describe the same device as `metrics.model` and the
 * `User-Agent` / `X-User-Agent` request headers, or the profile reads as a
 * forgery.
 *
 * Some panels also pin the model a MAC first registered with: the same MAC
 * presenting a different `stb_type` is refused as a device conflict. The
 * model is therefore selectable per playlist (`Playlist.stalkerStbModel`),
 * and each choice drives a complete profile from this table. MAG250 stays
 * the default and keeps exactly the values sent before the choice existed.
 */
export const STALKER_STB_MODELS = ['MAG250', 'MAG424'] as const;

export type StalkerStbModel = (typeof STALKER_STB_MODELS)[number];

export const DEFAULT_STALKER_STB_MODEL: StalkerStbModel = 'MAG250';

export interface StalkerStbProfile {
    model: StalkerStbModel;
    /** Device parameters sent on `get_profile`. */
    params: Readonly<Record<string, string>>;
    /** `metrics.model` of the `get_profile` metrics JSON. */
    metricsModel: string;
    /** `User-Agent` header of every portal request. */
    userAgent: string;
    /** `X-User-Agent` header of every portal request. */
    xUserAgent: string;
}

/**
 * User-Agent of a MAG250 set-top box (matches the stalker-to-m3u reference
 * implementation). The default profile sends it as both `User-Agent` and
 * `X-User-Agent` on every portal API request — some panels reject requests
 * without it.
 */
export const STALKER_MAG_USER_AGENT =
    'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG250';

/** Parameters common to every emulated MAG box. */
const COMMON_STB_PARAMS = {
    client_type: 'STB',
    num_banks: '2',
    video_out: 'hdmi',
    hd: '1',
} as const;

const STALKER_STB_PROFILES: Readonly<
    Record<StalkerStbModel, StalkerStbProfile>
> = Object.freeze({
    MAG250: Object.freeze({
        model: 'MAG250',
        params: Object.freeze({
            /** Firmware banner a MAG250 reports verbatim. */
            ver: 'ImageDescription: 0.2.18-r14-pub-250; ImageDate: Fri Jan 15 15:20:44 EET 2016; PORTAL version: 5.6.0; API Version: JS API version: 328; STB API version: 134; Player Engine version: 0x566',
            /** Was sent empty before — some panels treat that as "not a box". */
            stb_type: 'MAG250',
            hw_version: '1.7-BD-00',
            /** Numeric form of the `0.2.18` firmware in `ver`. */
            image_version: '218',
            ...COMMON_STB_PARAMS,
        }),
        metricsModel: 'MAG250',
        userAgent: STALKER_MAG_USER_AGENT,
        xUserAgent: STALKER_MAG_USER_AGENT,
    }),
    MAG424: Object.freeze({
        model: 'MAG424',
        params: Object.freeze({
            /** Firmware banner of the 2.20.02 MAG424 image. */
            ver: 'ImageDescription: 2.20.02-pub-424; ImageDate: Fri May 8 15:39:55 UTC 2020; PORTAL version: 5.6.1; API Version: JS API version: 343; STB API version: 146; Player Engine version: 0x588',
            stb_type: 'MAG424',
            hw_version: '1.7-BD-00',
            /** Numeric form of the `2.20` firmware in `ver`. */
            image_version: '220',
            /** API signature this firmware reports alongside its profile. */
            api_signature: '366',
            ...COMMON_STB_PARAMS,
        }),
        metricsModel: 'MAG424',
        /**
         * The MAG4xx portal browser keeps the MAG200 `stbapp` engine string;
         * the model itself travels in `X-User-Agent`.
         */
        userAgent:
            'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
        xUserAgent: 'Model: MAG424; Link: WiFi',
    }),
});

/** True for a model name this table has a profile for. */
export function isStalkerStbModel(value: unknown): value is StalkerStbModel {
    return (
        typeof value === 'string' &&
        (STALKER_STB_MODELS as readonly string[]).includes(value)
    );
}

/**
 * The persisted form of a playlist's model choice: a known non-default model,
 * or `undefined` for the default, blank or unknown values. Keeping the
 * default absent leaves existing playlists — and the session fingerprints
 * computed from them — exactly as they were.
 */
export function normalizeStalkerStbModel(
    value: unknown
): StalkerStbModel | undefined {
    const trimmed = typeof value === 'string' ? value.trim().toUpperCase() : '';
    return isStalkerStbModel(trimmed) && trimmed !== DEFAULT_STALKER_STB_MODEL
        ? trimmed
        : undefined;
}

/** The complete, coherent profile for a (possibly absent) model choice. */
export function getStalkerStbProfile(value?: unknown): StalkerStbProfile {
    return STALKER_STB_PROFILES[
        normalizeStalkerStbModel(value) ?? DEFAULT_STALKER_STB_MODEL
    ];
}

/**
 * Device parameters of the default MAG250 profile. Kept for callers that do
 * not carry a playlist; per-playlist code reads `getStalkerStbProfile()`.
 *
 * These constants are deliberately excluded from the identity/session
 * fingerprints; only a non-default model choice is part of them.
 */
export const STALKER_STB_PROFILE_PARAMS: Readonly<Record<string, string>> =
    STALKER_STB_PROFILES.MAG250.params;
