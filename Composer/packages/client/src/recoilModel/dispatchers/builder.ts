/* eslint-disable react-hooks/rules-of-hooks */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { useRecoilCallback, CallbackInterface } from 'recoil';

import * as luUtil from '../../utils/luUtil';
import { BotStatus } from '../../constants';
import httpClient from '../../utils/httpUtil';
import luFileStatusStorage from '../../utils/luFileStatusStorage';
import qnaFileStatusStorage from '../../utils/qnaFileStatusStorage';
import { botStatusState, dialogsState, luFilesState, qnaFilesState } from '../atoms';

export const builderDispatcher = () => {
  const build = useRecoilCallback(
    (callbackHelpers: CallbackInterface) => async (authoringKey, subscriptionKey, projectId) => {
      try {
        const dialogs = await callbackHelpers.snapshot.getPromise(dialogsState);
        const luFiles = await callbackHelpers.snapshot.getPromise(luFilesState);
        const qnaFiles = await callbackHelpers.snapshot.getPromise(qnaFilesState);
        const referredLuFiles = luUtil.checkLuisBuild(luFiles, dialogs);
        //TODO crosstrain should add locale
        const crossTrainConfig = luUtil.createCrossTrainConfig(dialogs, referredLuFiles);
        const response = await httpClient.post(`/projects/${projectId}/build`, {
          authoringKey,
          subscriptionKey,
          projectId,
          crossTrainConfig,
          luFiles: referredLuFiles.map((file) => file.id),
          qnaFiles: qnaFiles.map((file) => file.id),
        });
        luFileStatusStorage.publishAll(projectId);
        qnaFileStatusStorage.publishAll(projectId);
        callbackHelpers.set(botStatusState, BotStatus.published);
      } catch (err) {
        callbackHelpers.set(botStatusState, BotStatus.published);
      }
    }
  );
  return {
    build,
  };
};
