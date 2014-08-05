#include <cstdlib>
#include <iostream>
#include <string>

#include <mongo/client/dbclient.h> // for the driver
#include <mongo/bson/bson.h>

#include <Wt/WServer>
#include <Wt/WResource>
#include <Wt/Http/Response>

using namespace Wt;
using namespace mongo;
using namespace std;

class GeoQueryHandler : public Wt::WResource {
public:
  virtual ~GeoQueryHandler() {
    beingDeleted();
  }

protected:
  virtual void handleRequest(const Wt::Http::Request &request, Wt::Http::Response &response) {
    static bool firstRequest = true;
    if (firstRequest) {
      Query query;
      conn.connect("localhost");
      cursor = conn.query("geodata.taxis", query.sort("pickup_datetime"));
      nTripsReturned = 0;
      firstRequest = false;
    }

    if (!cursor->more()) {
      cout << endl << endl << "------------ALL DONE------------" << endl << endl << endl;
      response.out() << "[]\r\n";
      return;
    }

    if (nTripsReturned % 100000 == 0)
      cout << endl << nTripsReturned << endl << endl;

    response.out() << "[ " << cursor->next().jsonString(Strict, true);
    nTripsReturned++;
    for (size_t i = 0; i < kBatchSize - 1 && cursor->more(); i++) {
      string s = cursor->next().jsonString(Strict, true);
      response.out() << ",\n" << s;
      nTripsReturned++;
    }
    response.out() << " ]\r\n";
  }

private:
  static const size_t kBatchSize = 20;
  size_t nTripsReturned;
  auto_ptr<DBClientCursor> cursor;
  DBClientConnection conn;
};

int main(int argc, char **argv)
{
   try {
       WServer server(argv[0]);
       server.setServerConfiguration(argc, argv);

       GeoQueryHandler geoHandler;
       server.addResource(&geoHandler, "/geo");

       if (server.start()) {
           WServer::waitForShutdown();
           server.stop();
       }
   } catch (WServer::Exception& e) {
       std::cerr << e.what() << std::endl;
   } catch (std::exception &e) {
       std::cerr << "exception: " << e.what() << std::endl;
   }
}
