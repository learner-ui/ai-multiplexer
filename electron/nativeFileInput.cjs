function getFindTaggedFileInputExpression(token) {
  return `(() => {
    const token = ${JSON.stringify(token)};
    const roots = [document];
    for (let index = 0; index < roots.length; index += 1) {
      const root = roots[index];
      const inputs = Array.from(root.querySelectorAll('input[type="file"]'));
      for (const input of inputs) {
        if (input.getAttribute('data-ai-multiplexer-file-input-token') === token) {
          return input;
        }
      }

      for (const element of Array.from(root.querySelectorAll('*'))) {
        if (element.shadowRoot) {
          roots.push(element.shadowRoot);
        }
      }
    }

    return null;
  })()`;
}

function normalizeFilePaths(filePaths) {
  return Array.isArray(filePaths)
    ? filePaths.filter((filePath) => typeof filePath === 'string' && filePath.length > 0)
    : [];
}

async function setTaggedFileInputFiles(contents, token, filePaths) {
  if (!contents || contents.isDestroyed?.()) {
    return { ok: false, reason: 'webcontents-unavailable' };
  }

  if (typeof token !== 'string' || token.length === 0) {
    return { ok: false, reason: 'invalid-token' };
  }

  const files = normalizeFilePaths(filePaths);
  if (files.length === 0) {
    return { ok: false, reason: 'file-paths-missing' };
  }

  const debug = contents.debugger;
  const wasAttached = debug.isAttached();

  try {
    if (!wasAttached) {
      debug.attach('1.3');
    }

    await debug.sendCommand('DOM.enable');
    const { result } = await debug.sendCommand('Runtime.evaluate', {
      expression: getFindTaggedFileInputExpression(token),
      objectGroup: 'ai-multiplexer-file-input',
      returnByValue: false,
    });

    if (!result?.objectId) {
      return { ok: false, reason: 'file-input-not-found' };
    }

    await debug.sendCommand('DOM.setFileInputFiles', {
      objectId: result.objectId,
      files,
    });
    await debug.sendCommand('Runtime.releaseObjectGroup', {
      objectGroup: 'ai-multiplexer-file-input',
    }).catch(() => {});

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'native-file-input-failed',
    };
  } finally {
    if (!wasAttached && debug.isAttached()) {
      debug.detach();
    }
  }
}

module.exports = {
  getFindTaggedFileInputExpression,
  setTaggedFileInputFiles,
};
