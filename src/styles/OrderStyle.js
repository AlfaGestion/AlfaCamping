import { StyleSheet } from "react-native";
import Colors from "./Colors";
import { verticalScale, horizontalScale, moderateScale } from "@/utils/Metrics"

const remoteOrderStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  title: {
    textAlign: "center",
    fontSize: 16,
  },
  loader: {
    padding: 20,
  },
  container: {
    padding: 20,
    flex: 1,
  },
  btnSearchPayment: {
    padding: 10,
    backgroundColor: Colors.DBLUE,
    textAlign: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  textBtn: {
    color: Colors.WHITE,
  },
  containerDates: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "stretch",
    marginVertical: 20,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 10,
  },
});

const remoteDetailOrderStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    marginTop: 15,
    padding: 10,
  },
  headContainer: {
    alignItems: "center",
    marginVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GREY,
    paddingBottom: 20,
  },
  nameCustomer: {
    fontSize: 20,
    marginTop: 10,
    textAlign: "center",
  },
  title: {
    fontSize: 18,
  },
  textTotal: {
    fontSize: 18,
    padding: 5,
  },
  containerTotal: {
    padding: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.GREY,
  },
});

const IngresosStyles = StyleSheet.create({
  containerBtnNewIngreso: {
    margin: 10,
    paddingHorizontal: 20,
    borderBottomColor: Colors.GREY,
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  btnNewIngreso: {
    textAlign: "center",
    padding: 10,
    backgroundColor: Colors.DBLUE,
    borderRadius: 5,
    fontFamily: "Poppins-Regular",
  },
  textNewIngresoBtn: {
    textAlign: "center",
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: Colors.WHITE,
  },
})

const LocalOrdersStyles = StyleSheet.create({
  containerBtnNewOrden: {
    margin: 10,
    paddingHorizontal: 20,
    borderBottomColor: Colors.GREY,
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  btnNewOrder: {
    textAlign: "center",
    padding: 10,
    backgroundColor: Colors.DBLUE,
    borderRadius: 5,
    fontFamily: "Poppins-Regular",
  },
  textNewOrderBtn: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: Colors.WHITE,
    fontFamily: "Poppins-Regular",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 15,
    margin: 10,
    fontFamily: "Poppins-Regular",
  },
  textDelOrder: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
  },
});

const newOrderStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  inputSearchCustomer: {
    borderColor: Colors.GREY,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    margin: 20,
    marginBottom: 0,
    borderRadius: 10,
    fontFamily: "Poppins-Regular",
  },
  viewSearch: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    textAlign: "center",
  },
  containerSelCustomer: {
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: Colors.GREY,
    borderStyle: "dotted",
    padding: 15,
    backgroundColor: Colors.WHITE,
  },
  btnCancelCustomer: {
    width: 20,
    height: 20,
    position: "absolute",
    fontFamily: "Poppins-Regular",
    right: 10,
    top: 10,
  },
  textBtnCancelCustomer: {
    backgroundColor: "#EA7457",
    fontFamily: "Poppins-Regular",
    borderRadius: 10,
    width: "100%",
    textAlign: "center",
    color: Colors.WHITE,
  },
  searchProducts: {
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 0,
  },
  inputSearch: {
    borderColor: Colors.GREY,
    borderWidth: 1,
    left: 10,
    fontFamily: "Poppins-Regular",
    width: "95%",
    padding: 10,
    backgroundColor: Colors.WHITE,
  },
  viewSearchProducts: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    position: "absolute",
    top: 50,
    left: 0,
    width: "100%",
    backgroundColor: Colors.WHITE,
  },
  selecPriceClass: {
    marginBottom: 10,
    borderColor: Colors.GREY,
  },
  containerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: horizontalScale(10),
    marginBottom: 10
  },
  btnData: {
    backgroundColor: Colors.DBLUE,
  },
  btnOptions: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: horizontalScale(15),
    // marginBottom: 10,
    // width: "40%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    borderRadius: 5,
  },
  textBtnOptions: {
    color: Colors.WHITE,
    textAlign: "center",
    marginLeft: 5,
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    includeFontPadding: false
  },
  btnSave: {
    backgroundColor: Colors.DGREEN,
    borderRadius: 5,
  },
  btnOut: {
    backgroundColor: Colors.LBLUE,
    borderRadius: 5,
  },
  btnCancel: {
    backgroundColor: Colors.ERROR,
    borderRadius: 5,
  },
  textDelProducto: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 12,
  },
  containerEditLabels: {
    alignItems: "center",
  },
  containerEditButtons: {
    width: "95%",
    marginLeft: 10,
  },
  textEditOrder: {
    width: "90%",
    textAlign: "center",
    padding: 5,
    backgroundColor: Colors.LBLUE,
    color: Colors.WHITE,
    marginBottom: 10,
  },
  btnDeleteOrder: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  productSearchList: {
    backgroundColor: "#fff",
    width: "95%",
    left: 10,
  }
});

const cModalQtyStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    // borderColor: "red",
    // borderWidth: 1
  },
  centeredView: {
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    height: "100%",
  },
  modalView: {
    borderColor: Colors.GREY,
    borderWidth: 1,
    margin: 20,
    width: "80%",
    // height: verticalScale(350),
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: Colors.GREY,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  containerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 10
  },
  button: {
    borderRadius: 2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 2,
    marginHorizontal: horizontalScale(10),
  },
  buttonCancel: {
    backgroundColor: Colors.ERROR,
  },
  buttonAccept: {
    backgroundColor: Colors.DBLUE,
  },
  inputQty: {
    borderWidth: 1,
    borderColor: Colors.GREY,
    padding: 10,
    padding: 2,
    paddingHorizontal: 10,
  },
  inputQtyContainer: {
    padding: 10,
    width: "100%",
  },
  textStyle: {
    color: Colors.WHITE,
    // fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    fontSize: moderateScale(15),
    marginBottom: verticalScale(15),
    textAlign: "center",
  },
  textSmall: {
    fontSize: 12,
  },
  btnStock: {
    padding: 10,
    backgroundColor: Colors.LBLUE,
    alignItems: "center",
    borderRadius: 2,
    marginBottom: verticalScale(5)
  },
  textBtnStock: {
    color: Colors.WHITE,
    fontSize: moderateScale(14)
  },
  containerTextProduct: {
    marginVertical: verticalScale(10),
    borderTopColor: Colors.GREY,
    borderTopWidth: 1,
    borderBottomColor: Colors.GREY,
    borderBottomWidth: 1,
    paddingVertical: verticalScale(10)
  },
  textProduct: {
    fontSize: moderateScale(12)
  },
  stockCritic: {
    backgroundColor: Colors.RED,
    padding: 5,
    fontSize: moderateScale(14),
    color: Colors.WHITE,
    borderRadius: 2
  },
  stockOk: {
    backgroundColor: Colors.GREEN,
    padding: 5,
    fontSize: moderateScale(14),
    color: Colors.WHITE,
    borderRadius: 2
  },
  containerWithOutConnecction: {
    backgroundColor: Colors.RED,
    padding: 5
  },
  textWithOutConnection: {
    color: Colors.WHITE,
    fontSize: moderateScale(14),
  },
  errorStockText: {
    padding: 5,
    backgroundColor: Colors.RED,
    marginTop: 10,
    width: "100%",
    textAlign: "center",
    color: Colors.WHITE
  }
});

export { remoteOrderStyles, newOrderStyles, LocalOrdersStyles, remoteDetailOrderStyles, cModalQtyStyles, IngresosStyles };
