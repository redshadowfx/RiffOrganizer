import React, { useRef } from 'react';
import Modal from './UI/Modal';
import { useFetcher } from 'react-router-dom';
import FormInput from './UI/FormInput';
import { useDispatch, useSelector } from 'react-redux';
import { songsActions } from '../store/songs-slice';
import { StoreStateType } from '../store';
import FormButtonList from './UI/FormButtonList';
import Button from './UI/Button';
import useInput from './UI/hooks/use-input';
import FormSongSectionList from './UI/FormSongSectionList';
import FormSongSection from './UI/FormSongSection';
import { insertSections, insertSong } from '../API/DataAccessLayer';
import { SectionType } from '../store/songs-slice';

type NewSectionType = Omit<SectionType, 'id'>;

function AddSongForm() {
  const fetcher = useFetcher();
  const songNameInput = useInput((value: string) => value.trim() !== '');
  const artistNameInput = useInput((value: string) => value.trim() !== '');
  const songName = useRef<HTMLInputElement>(null);
  const artistName = useRef<HTMLInputElement>(null);

  // TODO: maybe use a Map instad of an object arrray
  const sectionList = [
    { ref: useRef<HTMLInputElement>(null), name: 'Intro' },
    { ref: useRef<HTMLInputElement>(null), name: 'Verse' },
    { ref: useRef<HTMLInputElement>(null), name: 'Pre-Chorus' },
    { ref: useRef<HTMLInputElement>(null), name: 'Chorus' },
    { ref: useRef<HTMLInputElement>(null), name: 'Bridge' },
    { ref: useRef<HTMLInputElement>(null), name: 'Outro' },
  ];

  const dispatch = useDispatch();
  const isVisible = useSelector(
    (state: StoreStateType) => state.songs.isSongFormVisible
  );
  const userId = useSelector(
    (state: StoreStateType) => state.user.userInfo.userId
  );

  function formValidationCondition() {
    return songNameInput.isValid && artistNameInput.isValid;
  }

  const formIsValid = formValidationCondition();

  function closeModalHandler() {
    dispatch(songsActions.closeSongForm());
  }

  async function addSongHandler() {
    const { data: songsData } = await insertSong(
      artistName.current?.value.trim() as string,
      songName.current?.value.trim() as string,
      userId
    );

    const songId = songsData?.at(0)?.id;

    const selectedSections: NewSectionType[] = sectionList
      .filter((section) => section.ref.current?.checked === true) // only desired sections
      .map((section) => {
        return {
          song_id: songId,
          name: section.name,
          status: 'not started',
        } as NewSectionType;
      });

    const { data: sectionsData } = await insertSections(selectedSections);

    // update the store to update ui...
    const newSongForStore = {
      artist_name: artistName.current?.value.trim(),
      song_name: songName.current?.value.trim(),
      user_id: userId,
      id: songId,
      sections: sectionsData as [],
    };

    dispatch(songsActions.addSong(newSongForStore));
    songNameInput.reset();
    artistNameInput.reset();
    closeModalHandler();
  }

  return isVisible ? (
    <Modal title='Add a new song' onClick={closeModalHandler}>
      <fetcher.Form className=' min-w-fit w-1/2 mx-auto'>
        <FormInput
          inputLabel='Song Name'
          inputId='song-name'
          inputType='text'
          errorMessage='Song name must not be empty'
          hasError={songNameInput.hasError}
          onChange={songNameInput.onChangeHandler}
          onBlur={songNameInput.onBlurHandler}
          ref={songName}
        />
        <FormInput
          inputLabel='Artist Name'
          inputId='artist-name'
          inputType='text'
          errorMessage='Artist name must not be empty'
          hasError={artistNameInput.hasError}
          onChange={artistNameInput.onChangeHandler}
          onBlur={artistNameInput.onBlurHandler}
          ref={artistName}
        />

        <FormSongSectionList>
          {sectionList.map((section) => (
            <FormSongSection
              key={section.name}
              name={section.name}
              ref={section.ref}
            />
          ))}
        </FormSongSectionList>
        <FormButtonList>
          <Button outline onClick={closeModalHandler}>
            Cancel
          </Button>
          <Button onClick={addSongHandler} disabled={!formIsValid}>
            Add Song
          </Button>
        </FormButtonList>
      </fetcher.Form>
    </Modal>
  ) : null;
}

export default AddSongForm;
