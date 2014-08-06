#include <cstdlib>
#include <cmath>
#include <limits>
#include <iostream>
#include <string>

#include <mongo/client/dbclient.h> // for the driver
#include <mongo/bson/bson.h>
#include <mongo/geo/interface.h>

#include <Wt/WServer>
#include <Wt/WResource>
#include <Wt/Http/Response>

using namespace Wt;
using namespace mongo;
using namespace mongo::geo::coords2dgeographic;
using namespace std;

static double distance(const Point& p1, const Point& p2) {
  mongo::geo::Coordinates2DGeographic c1 = p1.getCoordinates();
  mongo::geo::Coordinates2DGeographic c2 = p2.getCoordinates();
  double lon1 = c1.getLongitude();
  double lat1 = c1.getLatitude();
  double lon2 = c2.getLongitude();
  double lat2 = c2.getLatitude();
  return sqrt(pow(lon2 - lon1, 2) + pow(lat2 - lat1, 2));
}

static Point findRecommendation(const vector<BSONObj>& bson) {
  vector<Point> points;
  for (size_t i = 0; i < bson.size(); ++i) {
    Point p(bson[i]["start_loc"].Obj());
    points.push_back(p);
    // cout << p.toBSON().toString() << endl;
  }

  Point center = points[0];
  double centerSumDistances = std::numeric_limits<double>::max();;
  for (size_t i = 0; i < points.size(); ++i) {
    double distSum = 0;
    for (size_t j = 0; j < points.size(); ++j) {
      if (i == j) continue;
      distSum += distance(points[i], points[j]);
    }
    if (distSum < centerSumDistances) {
      center = points[i];
      centerSumDistances = distSum;
    }
  }

  return center;
}

class GeoQueryHandler : public Wt::WResource {
public:
  GeoQueryHandler() {
    Query query;
    conn.connect("localhost");
    cursor = conn.query("geodata.taxis", query.sort("pickup_datetime"));
    nTripsReturned = 0;
  }
  virtual ~GeoQueryHandler() {
    beingDeleted();
  }

protected:
  virtual void handleRequest(const Wt::Http::Request &request, Wt::Http::Response &response) {
    if (!cursor->more()) {
      cout << endl << endl << "------------ALL DONE------------" << endl << endl << endl;
      response.out() << "[]\r\n";
      return;
    }

    vector<BSONObj> trips;
    BSONObj curTrip(cursor->next());
    response.out() << "[ " << curTrip.jsonString(Strict, true);
    trips.push_back(curTrip);
    nTripsReturned++;
    for (size_t i = 0; i < kBatchSize - 1 && cursor->more(); i++) {
      curTrip = cursor->next();
      response.out() << ",\n" << curTrip.jsonString(Strict, true);
      trips.push_back(curTrip);
      nTripsReturned++;
    }
    // response.out() << " ]\r\n";

    Point center = findRecommendation(trips);
    response.out() << ",\n" << center.toBSON().jsonString() << " ]\r\n";
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
