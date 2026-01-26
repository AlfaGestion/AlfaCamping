export function formatDate(date, fString = false, alternativeFormat = false) {
  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();

  if (fString) {
    let sMonth = month < 10 ? `0${month}` : month;
    let sDay = day < 10 ? `0${day}` : day;

    if (alternativeFormat) {
      return `${year}${sMonth}${sDay}`;
    } else {
      return `${sDay}/${sMonth}/${year}`;
    }
  } else {
    return new Date(year, month - 1, day, 0, 0, 0);
  }
}

// export { formatDate };

export function currencyFormat(num) {
  if (num != undefined && num != null && num != "") {
    if (typeof num == "string") {
      num = parseFloat(num)
    }
    return '$ ' + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  } else {
    return '$ 0.00'
  }
  // return parseFloat(num).toLocaleString('en-IN')
}