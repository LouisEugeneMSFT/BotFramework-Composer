// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/* eslint-disable react-hooks/rules-of-hooks */
import { LuFile, LuIntentSection } from '@bfc/shared';
import { useRecoilCallback, CallbackInterface } from 'recoil';

import luFileStatusStorage from '../../utils/luFileStatusStorage';
import LuWorker from '../parsers/luWorker';
import { luFilesState } from '../atoms/botState';
import luWorker from '../parsers/luWorker';

import { projectIdState } from './../atoms/botState';

export const luDispatcher = () => {
  const updateFile = async (
    { set, snapshot }: CallbackInterface,
    { id, content, projectId }: { id: string; content: string; projectId: string }
  ) => {
    let luFiles = await snapshot.getPromise(luFilesState);
    const result = (await LuWorker.parse(id, content)) as LuFile;
    luFiles = luFiles.map((file) => (file.id === id ? result : file));
    luFileStatusStorage.updateFileStatus(projectId, id);
    set(luFilesState, luFiles);
  };

  const updateLuFile = useRecoilCallback(
    (callbackHelpers: CallbackInterface) => async ({
      id,
      content,
      projectId,
    }: {
      id: string;
      content: string;
      projectId: string;
    }) => {
      await updateFile(callbackHelpers, { id, content, projectId });
    }
  );

  const updateLuIntent = useRecoilCallback(
    (callbackHelpers: CallbackInterface) => async ({
      id,
      intentName,
      intent,
    }: {
      id: string;
      intentName: string;
      intent: LuIntentSection;
    }) => {
      const luFiles = await callbackHelpers.snapshot.getPromise(luFilesState);
      const projectId = await callbackHelpers.snapshot.getPromise(projectIdState);
      const file = luFiles.find((temp) => temp.id === id);
      if (!file) return;
      const content = (await luWorker.updateIntent(file.content, intentName, intent)) as string;
      await updateFile(callbackHelpers, { id: file.id, projectId, content });
    }
  );

  const createLuIntent = useRecoilCallback(
    (callbackHelpers: CallbackInterface) => async ({ id, intent }: { id: string; intent: LuIntentSection }) => {
      const luFiles = await callbackHelpers.snapshot.getPromise(luFilesState);
      const projectId = await callbackHelpers.snapshot.getPromise(projectIdState);
      const file = luFiles.find((temp) => temp.id === id);
      if (!file) return;
      const content = (await luWorker.addIntent(file.content, intent)) as string;
      await updateFile(callbackHelpers, { id: file.id, projectId, content });
    }
  );

  const removeLuIntent = useRecoilCallback(
    (callbackHelpers: CallbackInterface) => async ({ id, intentName }: { id: string; intentName: string }) => {
      const luFiles = await callbackHelpers.snapshot.getPromise(luFilesState);
      const projectId = await callbackHelpers.snapshot.getPromise(projectIdState);
      const file = luFiles.find((temp) => temp.id === id);
      if (!file) return;
      const content = (await luWorker.removeIntent(file.content, intentName)) as string;
      await updateFile(callbackHelpers, { id: file.id, projectId, content });
    }
  );

  return {
    updateLuFile,
    updateLuIntent,
    createLuIntent,
    removeLuIntent,
  };
};
