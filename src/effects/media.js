import { useState, useEffect } from 'react';
import { get } from 'lodash';
import MediaTypes from '../types/MediaTypes';
import { fetchMediaList, fetchSharedMembers } from '../utils/media';

async function getFolderSize(id) {
  let totalSize = 0;
  const allMedia = await fetchMediaList(id);
  (allMedia || []).forEach(async (media) => {
    if (media.mime.includes('folder'))
      totalSize += await getFolderSize(media.id);
    else totalSize += media?.size || 0;
  });

  return totalSize;
}

export function useMediaList(id) {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const mediaList = await fetchMediaList(id);
        const mergedMediaList = await Promise.all(
          mediaList.map(async (media) => {
            let type;
            if (media.mime.includes('folder')) type = MediaTypes.FOLDER;
            else if (media?.video) type = MediaTypes.MP4;
            else type = MediaTypes.JPG;

            let size;
            if (type === MediaTypes.FOLDER)
              size = await getFolderSize(media.id);
            else size = media?.size || 0;

            return {
              ...media,
              type,
              size,
              sharedWith: await fetchSharedMembers(media.id),
            };
          })
        );
        setData(mergedMediaList);
      } catch (err) {
        console.error(err);
        setData([]);
      }
    }

    setData(null);
    fetchData();
  }, [id]);

  return data;
}

export function useFilteredMediaList(data, searchQuery) {
  const [mediaList, setMediaList] = useState([]);

  useEffect(() => {
    const sortedData = (data || []).map((media) => {
      return {
        id: media.id,
        name: media?.name || 'Unknown Media',
        dateCreated: new Date(media?.created?.on),
        size: media.size,
        isSelected: false,
        sharedWith: Object.entries(media?.sharedWith || []).map(
          ([, member]) => ({
            name: get(member, 'name', ''),
            userId: member?.id,
            email: member?.email,
          })
        ),
        type: media?.type,
        url: media?.url,
        video: media?.video,
        audio: media?.audio,
        duration: media?.duration,
        parent: media?.folder,
      };
    });

    const filterdData = sortedData.filter((media) =>
      media.name.toUpperCase().includes(searchQuery.toUpperCase())
    );

    setMediaList(filterdData);
  }, [data, searchQuery]);

  return [mediaList, setMediaList];
}
