import { normalizeStalkerPortalIdentity } from './stalker-identity.utils';
import {
    DEFAULT_STALKER_STB_MODEL,
    getStalkerStbProfile,
    normalizeStalkerStbModel,
    STALKER_MAG_USER_AGENT,
    STALKER_STB_MODELS,
    STALKER_STB_PROFILE_PARAMS,
} from './stalker-stb-profile.const';

describe('Stalker set-top box profiles', () => {
    it('keeps the default MAG250 profile exactly as before', () => {
        const profile = getStalkerStbProfile();

        expect(DEFAULT_STALKER_STB_MODEL).toBe('MAG250');
        expect(profile.params).toBe(STALKER_STB_PROFILE_PARAMS);
        expect(profile.params).toEqual({
            ver: 'ImageDescription: 0.2.18-r14-pub-250; ImageDate: Fri Jan 15 15:20:44 EET 2016; PORTAL version: 5.6.0; API Version: JS API version: 328; STB API version: 134; Player Engine version: 0x566',
            stb_type: 'MAG250',
            hw_version: '1.7-BD-00',
            image_version: '218',
            client_type: 'STB',
            num_banks: '2',
            video_out: 'hdmi',
            hd: '1',
        });
        expect(profile.metricsModel).toBe('MAG250');
        expect(profile.userAgent).toBe(STALKER_MAG_USER_AGENT);
        expect(profile.xUserAgent).toBe(STALKER_MAG_USER_AGENT);
    });

    it('describes a MAG424 with its own firmware, metrics and headers', () => {
        const profile = getStalkerStbProfile('MAG424');

        expect(profile.params).toEqual({
            ver: 'ImageDescription: 2.20.02-pub-424; ImageDate: Fri May 8 15:39:55 UTC 2020; PORTAL version: 5.6.1; API Version: JS API version: 343; STB API version: 146; Player Engine version: 0x588',
            stb_type: 'MAG424',
            hw_version: '1.7-BD-00',
            image_version: '220',
            api_signature: '366',
            client_type: 'STB',
            num_banks: '2',
            video_out: 'hdmi',
            hd: '1',
        });
        expect(profile.metricsModel).toBe('MAG424');
        expect(profile.userAgent).toBe(
            'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3'
        );
        expect(profile.xUserAgent).toBe('Model: MAG424; Link: WiFi');
    });

    it.each(STALKER_STB_MODELS)(
        'keeps every part of the %s profile on the same model',
        (model) => {
            const profile = getStalkerStbProfile(model);

            expect(profile.model).toBe(model);
            expect(profile.params['stb_type']).toBe(model);
            expect(profile.metricsModel).toBe(model);
            expect(profile.params['ver']).toContain(model.slice(3));
            expect(`${profile.userAgent} ${profile.xUserAgent}`).toContain(
                model
            );
        }
    );

    it.each([
        [undefined, undefined],
        ['', undefined],
        ['MAG250', undefined],
        [' mag424 ', 'MAG424'],
        ['MAG999', undefined],
        [424, undefined],
    ])('normalizes %p to %p', (value, expected) => {
        expect(normalizeStalkerStbModel(value)).toBe(expected);
    });

    it('falls back to the default profile for unknown models', () => {
        expect(getStalkerStbProfile('MAG999').model).toBe('MAG250');
    });

    it('carries only a non-default model in the portal identity', () => {
        expect(normalizeStalkerPortalIdentity({ stbModel: 'MAG250' })).toEqual(
            {}
        );
        expect(normalizeStalkerPortalIdentity({ stbModel: 'MAG424' })).toEqual({
            stbModel: 'MAG424',
        });
    });
});
