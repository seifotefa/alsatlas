import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDemoState, saveDemoState } from './storage.js';

test('demo storage survives a reload',()=>{const state=loadDemoState();const before=state.checkins.length;state.checkins.push({id:'test-restart',patientId:'demo-alex-chen',createdAt:new Date().toISOString(),energy:2,note:'test'});saveDemoState(state);const reloaded=loadDemoState();assert.equal(reloaded.checkins.length,before+1);assert.equal(reloaded.checkins.at(-1)?.id,'test-restart')});
