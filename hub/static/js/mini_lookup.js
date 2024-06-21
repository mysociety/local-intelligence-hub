const bisectLeft = (arr, x) => {
    let left = 0;
    let right = arr.length;
    while (left < right) {
        const mid = (left + right) >> 1;
        if (arr[mid] < x) left = mid + 1;
        else right = mid;
    }
    return left;
};

const postcodeRegex = /^(?:[A-Z]{2}[0-9][A-Z]|[A-Z][0-9][A-Z]|[A-Z][0-9]|[A-Z][0-9]{2}|[A-Z]{2}[0-9]|[A-Z]{2}[0-9]{2})[0-9][A-Z]{2}$/;

const checkRealPostcode = (postcode) => {
    return postcodeRegex.test(postcode.replace(/\s/g, "").toUpperCase());
};

class StoredData {
    constructor(postcodeKeys, valueKey, valueValues) {
        this.postcodeKeys = postcodeKeys;
        this.valueKey = valueKey;
        this.valueValues = valueValues;
    }
}

const reverseDifferenceCompression = (listA) => {
    let result = [];
    let lastValue = 0;
    for (let value of listA) {
        lastValue += value;
        result.push(lastValue);
    }
    return result;
};

const reverseDropMinusOne = (listA) => {
    let result = listA.slice(0, 2);
    for (let value of listA.slice(2)) {
        if (value === 0) {
            result.push(result[result.length - 2]);
        } else {
            result.push(value);
        }
    }
    return result.map(x => x - 1);
};

const postcodeToInt = (postcode) => {
    return parseInt(postcode.replace(/\s/g, "").toUpperCase(), 36);
};

class PostcodeRangeLookup {
    constructor(postcodeKeys, valueKey, valueValues) {
        this.postcodeKeys = postcodeKeys;
        this.valueKey = valueKey;
        this.valueValues = valueValues;
    }

    getValue(postcode, checkValidPostcode = true) {
        if (checkValidPostcode && !checkRealPostcode(postcode)) {
            return null;
        }

        // if starts with BT - NI, return null
        if (postcode.toUpperCase().startsWith("BT")) {
            return null;
        }

        const intPostcode = postcodeToInt(postcode);
        let left = bisectLeft(this.postcodeKeys, intPostcode);
        if (left === 0 && (intPostcode !== this.postcodeKeys[0])) {
            return null;
        }

        if (left < this.postcodeKeys.length && this.postcodeKeys[left] !== intPostcode) {
            left -= 1;
        }

        if (left == this.postcodeKeys.length) {
            left -= 1;
        }

        const valueIndex = this.valueKey[left];
        if (valueIndex === -1 || valueIndex >= this.valueValues.length) {
            return null;
        } else {
            return this.valueValues[valueIndex];
        }
    }

    static fromDict(data) {
        return new PostcodeRangeLookup(
            reverseDifferenceCompression(data.postcode_keys),
            reverseDropMinusOne(data.value_key),
            data.value_values
        );
    }

    static async fromJson(path) {
        const response = await fetch(path);
        const data = await response.json();
        return PostcodeRangeLookup.fromDict(data);
    }
}
