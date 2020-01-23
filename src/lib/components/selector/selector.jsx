import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';
import useOutsideClick from '../../util/useOutsideClick';
import useWindowSize from '../../util/useWindowSize';
import Button from '../button/button';
import Icon from '../icon/icon';
import Input from '../input/input';

const Selector = ({
  className,
  custom,
  customProp,
  defaultValue,
  minLengthSearch,
  maxOptions,
  nameProp,
  native,
  nullOption,
  optionClassName,
  options,
  placeholder,
  remoteOptions,
  search,
  valueProp,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [optionsWithNull, setOptionsWithNull] = useState(
    nullOption ? [{ ...nullOption, isNullOption: true }, ...options] : options
  );
  const [selectedOption, setSelectedOption] = useState(() => {
    if (defaultValue) {
      return defaultValue[valueProp]
        ? defaultValue
        : options.find(option => option[valueProp] === defaultValue);
    }
    return nullOption ? { ...nullOption, isNullOption: true } : null;
  });
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchStr, setSearchStr] = useState('');
  const windowSize = useWindowSize();
  const menuRef = useRef();
  const Custom = custom;

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    if (remoteOptions && !search) {
      searchRemote();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useOutsideClick(menuRef, () => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  const searchRemote = str => {
    remoteOptions
      .apiMethod(str)
      .then(res => {
        setOptionsWithNull(
          nullOption
            ? [{ ...nullOption, isNullOption: true }, ...res.data[remoteOptions.dataProp]]
            : res.data[remoteOptions.dataProp]
        );
      })
      .catch(err => console.log(err));
  };

  const handleOptionSelected = option => {
    setSelectedOption(option);
    setTimeout(() => setIsOpen(false), 0);
    onChange(option[valueProp]);
  };

  const handleSearchChange = str => {
    if (!searchRemote) {
      setSearchStr(str.toLowerCase());
    }
    if (str.length >= minLengthSearch) {
      searchRemote(str.toLowerCase());
    } else {
      setOptionsWithNull(nullOption ? [{ ...nullOption, isNullOption: true }] : []);
    }
  };

  const handleKeyDown = evt => {
    if (!isOpen) {
      return;
    }
    if (evt.key === 'ArrowUp') {
      if (focusedIndex > 0) {
        setFocusedIndex(focusedIndex - 1);
      }
      evt.preventDefault();
    } else if (evt.key === 'ArrowDown') {
      if (focusedIndex < optionsWithNull.length - 1) {
        setFocusedIndex(focusedIndex + 1);
      }
      evt.preventDefault();
    } else if (evt.key === 'Enter') {
      handleOptionSelected(
        optionsWithNull.filter(opt => filterOption(opt)).slice(0, maxOptions)[focusedIndex]
      );
    }
  };

  const filterOption = opt => {
    if (
      searchStr &&
      searchStr.length > minLengthSearch - 1 &&
      !opt[nameProp].toLowerCase().includes(searchStr)
    ) {
      return false;
    }
    return true;
  };

  const getIndexFirstToShow = () => {
    return focusedIndex - (maxOptions - 1) < 0 ? 0 : focusedIndex - (maxOptions - 1);
  };

  const optionHtml = (opt, isOptionSelected) => {
    if (custom && customProp) {
      const dynamicProps = { [customProp]: opt };
      return (
        <Custom
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...dynamicProps}
          className={`${isOptionSelected ? 'selector-option-selected' : ''}`}
        />
      );
    }
    if (custom) {
      return (
        <Custom className={`${isOptionSelected ? 'selector-option-selected' : ''}`}>opt</Custom>
      );
    }
    return opt[nameProp];
  };

  const customSelect = (
    <>
      <Button
        className="d-flex align-items-center"
        color="transparent"
        uppercase={false}
        size="lg"
        onClick={() => setIsOpen(true)}
      >
        {!selectedOption ? placeholder : optionHtml(selectedOption, true)}
        <Icon className="selector-icon" name="angle-down" size="sm" />
      </Button>
      <input type="hidden" value={(selectedOption && selectedOption[valueProp]) || ''} />
      <div className={`selector-menu ${isOpen ? 'show' : ''}`} ref={menuRef} tabIndex="0">
        {search ? (
          <div className="selector-searchbox">
            <Input onChange={handleSearchChange} />
          </div>
        ) : null}
        <div role="listbox" aria-expanded={isOpen} tabIndex="-1">
          <ul>
            {optionsWithNull
              .filter(opt => filterOption(opt))
              .slice(getIndexFirstToShow(), getIndexFirstToShow() + maxOptions)
              .map((opt, i) => {
                return (
                  <li key={opt[valueProp] || i + 1}>
                    <a
                      role="option"
                      aria-disabled="false"
                      aria-selected="false"
                      className={`${optionClassName} ${
                        selectedOption && opt[valueProp] === selectedOption[valueProp]
                          ? 'selected'
                          : ''
                      } ${
                        focusedIndex > -1 &&
                        optionsWithNull[focusedIndex][valueProp] === opt[valueProp]
                          ? 'focused'
                          : ''
                      }`}
                      onMouseEnter={() => setFocusedIndex(i)}
                      onClick={() => handleOptionSelected(opt)}
                    >
                      {optionHtml(opt)}
                    </a>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </>
  );

  const nativeSelect = (
    <div className="select-wrapper d-flex align-items-center">
      <select>
        <option>{placeholder}</option>
        {optionsWithNull.map(opt => (
          <option key={opt[valueProp]} value={opt[valueProp]}>
            {opt[nameProp]}
          </option>
        ))}
      </select>
      <Icon className="selector-icon" name="angle-down" size="sm" />
    </div>
  );

  console.log(optionsWithNull);

  return (
    <>
      <div className={`selector d-flex flex-column w-100 ${className}`}>
        {!native || (native === 'mobileOnly' && !(windowSize === 'xs' || windowSize === 'sm')) ? (
          <>{customSelect}</>
        ) : (
          <>{nativeSelect}</>
        )}
      </div>
    </>
  );
};

Selector.defaultProps = {
  className: '',
  custom: null,
  customProp: null,
  defaultValue: null,
  minLengthSearch: 2,
  maxOptions: 10,
  nameProp: 'name',
  native: 'mobileOnly',
  nullOption: null,
  placeholder: 'Please select an option',
  options: [],
  optionClassName: '',
  remoteOptions: null,
  search: false,
  valueProp: 'value',
  onChange: () => {}
};

Selector.propTypes = {
  className: PropTypes.string,
  custom: PropTypes.elementType,
  customProp: PropTypes.string,
  defaultValue: PropTypes.any,
  minLengthSearch: PropTypes.number,
  maxOptions: PropTypes.number,
  nameProp: PropTypes.string,
  native: PropTypes.oneOf([true, false, 'mobileOnly']),
  nullOption: PropTypes.object,
  options: PropTypes.array,
  optionClassName: PropTypes.string,
  placeholder: PropTypes.string,
  remoteOptions: PropTypes.shape({
    apiMethod: PropTypes.func,
    dataProp: PropTypes.string
  }),
  search: PropTypes.bool,
  valueProp: PropTypes.string,
  onChange: PropTypes.func
};

export default Selector;
