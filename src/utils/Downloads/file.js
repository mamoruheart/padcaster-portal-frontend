import MediaTypes from '../types/MediaTypes';
import { fetchMediaList } from './media';
import { requestJson } from './network';

export function formatFileSize(bytes, decimalPoint) {
  if (bytes == 0) return '0 Bytes';
  const dm = decimalPoint || 0;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1000));
  return parseFloat((bytes / Math.pow(1000, i)).toFixed(dm)) + ' ' + sizes[i];
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(milliseconds);
    }, milliseconds);
  });
}

async function downloadFile(file) {
  if (!file.url) return;
  const a = document.createElement('a');
  a.id = file.id;
  a.download = file.name;
  a.href = file.url;
  a.style.display = 'none';
  document.body.append(a);
  a.click();

  await delay(100);
  a.remove();
}

async function downloadFile2(file) {
  if (!file.url) return;

  fetch(file.url)
    .then((response) => response.blob())
    .then(async (blob) => {
      const blobURL = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.id = `hidden-downloader-${file.id}`;
      a.href = blobURL;
      a.style = 'display: none';

      if (file.name && file.name.length) a.download = file.name;
      document.body.appendChild(a);
      a.click();

      await delay(100);
      a.remove();
    })
    .catch(() => console.error('fetch url error'));
}

export async function downloadMultiFiles(allMedia) {
  allMedia.forEach(async (media, idx) => {
    if (media.type === MediaTypes.FOLDER) {
      const subMedia = await fetchMediaList(media.id);
      await downloadMultiFiles(subMedia);
    } else {
      // setTimeout(async function () {
      //   await downloadFile(media);
      // }, 2000 * idx);
      await downloadFile2(media);
    }
  });
}

export async function getS3SignedUrl(parent, name, size) {
  try {
    const response = await requestJson(
      `${process.env.TEST_API_URL}/files/${parent}/`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, size }),
      }
    );
    return response.parts[0].url;
  } catch (err) {
    console.error(err);
  }
  return null;
}

export async function uploadFile(parent, media, onUploadProgress) {
  const url = getS3SignedUrl(parent, media.name, media.size);
  // const uploader = new S3Upload({
  //   fileElement: this.fileInput,
  //   getSignedUrl: this.getSignedUrl,
  //   preprocess: this.preprocess,
  //   onProgress: this.onProgress,
  //   onFinishS3Put: this.onFinish,
  //   onError: this.onError,
  // });

  // const result = await upload1(
  //   response.parts[0].url,
  //   media.file,
  //   onUploadProgress
  // );

  // http.post('/upload', formData, {
  //   headers: {
  //     'Content-Type': 'multipart/form-data',
  //   },
  //   onUploadProgress,
  // });
}
