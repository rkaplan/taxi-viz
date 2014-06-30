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
    string host = "localhost";
    conn.connect(host);

    BSONObj query;
    auto_ptr<DBClientCursor> cursor = conn.query("geodata.taxis", query);
    response.out() << "[ " << cursor->next().jsonString(Strict, true);
    for (size_t i = 0; i < 10 && cursor->more(); i++) {
      string s = cursor->next().jsonString(Strict, true);
      response.out() << ",\n" << s;
    }
    response.out() << " ]\r\n";
  }

private:
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
